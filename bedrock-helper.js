/**
 * AWS Bedrock Helper Module
 * Handles all Bedrock API communication for generating quiz questions
 */

const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");

// Initialize Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate quiz questions using AWS Bedrock (Claude)
 * @param {string} prompt - The prompt/topic to generate questions about
 * @param {number} questionCount - Number of questions to generate (default: 5)
 * @returns {Promise<Array>} Array of question objects
 *
 * Expected output format:
 * [
 *   {
 *     id: 1,
 *     question: "Question text?",
 *     answers: ["Option 1", "Option 2", "Option 3", "Option 4"],
 *     correctAnswer: 2  // Index of correct answer (0-3)
 *   }
 * ]
 */
async function generateQuestions(prompt, questionCount = 5) {
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

  try {
    // Construct the Bedrock API payload
    const payload = {
      anthropic_version: "bedrock-2023-05-31", // API format version (stays the same)
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

    // Parse and validate questions
    const questions = JSON.parse(questionsText);

    // Validate structure
    if (!Array.isArray(questions)) {
      throw new Error("Response is not an array");
    }

    if (questions.length !== questionCount) {
      console.warn(
        `Expected ${questionCount} questions, got ${questions.length}`
      );
    }

    // Validate each question
    questions.forEach((q, idx) => {
      if (!q.question || typeof q.question !== "string") {
        throw new Error(`Invalid question text at index ${idx}`);
      }
      if (!Array.isArray(q.answers) || q.answers.length !== 4) {
        throw new Error(`Invalid answers array at index ${idx}`);
      }
      if (
        typeof q.correctAnswer !== "number" ||
        q.correctAnswer < 0 ||
        q.correctAnswer > 3
      ) {
        throw new Error(`Invalid correctAnswer at index ${idx}`);
      }
      // Ensure id is set
      q.id = q.id || idx + 1;
    });

    return questions;
  } catch (error) {
    console.error("Error generating questions from Bedrock:", error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
}

/**
 * Generate questions from document content
 * @param {string} documentContent - The text content of a document
 * @param {number} questionCount - Number of questions to generate
 * @returns {Promise<Array>} Array of question objects
 */
async function generateQuestionsFromDocument(
  documentContent,
  questionCount = 5
) {
  // Truncate document if too long (Bedrock has token limits)
  const maxContentLength = 10000; // characters
  const truncatedContent =
    documentContent.length > maxContentLength
      ? documentContent.substring(0, maxContentLength) + "..."
      : documentContent;

  const prompt = `Based on the following document content, generate ${questionCount} multiple-choice questions that test understanding of the key concepts:

${truncatedContent}`;

  return generateQuestions(prompt, questionCount);
}

module.exports = {
  generateQuestions,
  generateQuestionsFromDocument,
};
