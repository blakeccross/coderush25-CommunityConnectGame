import { NextRequest } from "next/server";
export const runtime = "nodejs";
import fs from "node:fs/promises";
import path from "node:path";
import { QUESTIONS } from "@/lib/game-store";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

async function generateQuestionsWithBedrock(prompt: string, questionCount = 5) {
  const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const systemPrompt = `You are a quiz question generator. Generate exactly ${questionCount} multiple-choice questions based on the given topic or content.

Each question must have:
- A clear, unambiguous question
- Exactly 4 answer options
- One correct answer
- The correct answer indicated by its index (0-3) in the answers array

Return ONLY a valid JSON array with no additional text, explanation, or markdown formatting.`;

  const userPrompt = `Generate ${questionCount} multiple-choice quiz questions about: ${prompt}

Return the response in this exact JSON format:
[
  {
    "id": 1,
    "question": "Question text here?",
    "answers": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": 0
  }
]

Rules:
- correctAnswer must be the index (0-3) of the correct answer
- Make questions challenging but fair
- Ensure answer options are plausible
- Cover different aspects of the topic
- Return ONLY the JSON array, no other text`;

  // Construct the Bedrock API payload
  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 4000,
    temperature: 0.7,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    system: systemPrompt,
  };

  // Create the Bedrock command
  const command = new InvokeModelCommand({
    modelId: "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  // Send request to Bedrock
  const response = await bedrockClient.send(command);

  // Parse response
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  let questionsText = responseBody.content[0].text;

  // Extract JSON from response (handles cases where AI might wrap in markdown)
  const jsonMatch = questionsText.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    questionsText = jsonMatch[0];
  }

  // Parse questions
  const questions = JSON.parse(questionsText);

  if (!Array.isArray(questions)) {
    throw new Error("Response is not an array");
  }

  // Ensure IDs are set
  questions.forEach((q: any, idx: number) => {
    q.id = q.id || idx + 1;
  });

  return questions;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const questionCount = typeof body?.questionCount === "number" && body.questionCount > 0 ? body.questionCount : 5;

    // Resolve source file from /public directory
    const source = body?.source;
    const fileName = typeof source === "string" ? source.replace(/^@/, "") : "ETB_students_Session1.txt";
    const filePath = path.join(process.cwd(), "public", fileName);
    const documentContent = await fs.readFile(filePath, "utf8");

    // Prefer Bedrock generation when credentials are present; otherwise fallback to sample questions
    const hasBedrockCreds = Boolean(process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

    let questions: any[] = [];
    let warning: string | undefined;

    if (hasBedrockCreds) {
      try {
        // Truncate document if too long (Bedrock has token limits)
        const maxContentLength = 10000;
        const truncatedContent = documentContent.length > maxContentLength ? documentContent.substring(0, maxContentLength) + "..." : documentContent;

        // Format prompt for document-based questions
        const prompt = `Based on the following document content, generate ${questionCount} multiple-choice questions that test understanding of the key concepts:\n\n${truncatedContent}`;

        questions = await generateQuestionsWithBedrock(prompt, questionCount);
      } catch (e: any) {
        console.error("Error generating questions:", e);
        warning = e?.message || "Bedrock generation failed; using fallback questions";
        questions = QUESTIONS.slice(0, questionCount);
      }
    } else {
      warning = "Missing AWS Bedrock credentials; using fallback questions";
      questions = QUESTIONS.slice(0, questionCount);
    }

    // Validate questions format
    if (!Array.isArray(questions) || questions.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid questions format" }), { status: 500 });
    }

    for (const [i, q] of questions.entries()) {
      if (
        typeof q?.question !== "string" ||
        !Array.isArray(q?.answers) ||
        q.answers.length !== 4 ||
        typeof q?.correctAnswer !== "number" ||
        q.correctAnswer < 0 ||
        q.correctAnswer > 3
      ) {
        return new Response(JSON.stringify({ error: `Invalid question at index ${i}` }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ questions, warning }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Failed to generate questions" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
