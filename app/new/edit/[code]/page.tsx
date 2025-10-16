"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { getSession, getSessionQuestions, updateSessionQuestions, type Question } from "@/lib/game-store";
import { ArrowLeft, GripVertical, Save, Plus, Trash2, Check } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export default function EditQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [session, setSession] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const sessionData = getSession(code);
    if (!sessionData) {
      router.push("/new");
      return;
    }
    setSession(sessionData);

    const sessionQuestions = getSessionQuestions(code);
    setQuestions(sessionQuestions);
  }, [code, router]);

  const handleQuestionChange = (index: number, field: keyof Question, value: string | number) => {
    const newQuestions = [...questions];
    if (field === "question") {
      newQuestions[index].question = value as string;
    } else if (field === "correctAnswer") {
      newQuestions[index].correctAnswer = value as number;
    }
    setQuestions(newQuestions);
  };

  const handleAnswerChange = (questionIndex: number, answerIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].answers[answerIndex] = value;
    setQuestions(newQuestions);
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: questions.length + 1,
      question: "New Question",
      answers: ["Answer 1", "Answer 2", "Answer 3", "Answer 4"],
      correctAnswer: 0,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert("You must have at least one question!");
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    // Re-index the questions
    newQuestions.forEach((q, i) => {
      q.id = i + 1;
    });
    setQuestions(newQuestions);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Re-index the questions
    items.forEach((q, i) => {
      q.id = i + 1;
    });

    setQuestions(items);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = updateSessionQuestions(code, questions);
    if (success) {
      // Navigate to session
      router.push(`/session/${code}`);
    } else {
      alert("Failed to save questions");
    }
    setIsSaving(false);
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      <div className="max-w-5xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push("/new")} variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Questions</h1>
              <p className="text-muted-foreground">Session Code: {code}</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            <Save className="w-5 h-5 mr-2" />
            Save & Continue
          </Button>
        </div>

        {/* Questions List */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {questions.map((question, index) => (
                  <Draggable key={question.id} draggableId={question.id.toString()} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`p-6 animate-slide-up ${snapshot.isDragging ? "shadow-2xl opacity-90" : ""}`}
                        style={{
                          ...provided.draggableProps.style,
                          animationDelay: `${index * 50}ms`,
                        }}
                      >
                        <div className="space-y-4">
                          {/* Question Header */}
                          <div className="flex items-start gap-3">
                            <div {...provided.dragHandleProps} className="mt-2 cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-lg font-semibold">Question {index + 1}</Label>
                                <Button
                                  onClick={() => handleDeleteQuestion(index)}
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Question Text */}
                              <div>
                                <Input
                                  value={question.question}
                                  onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
                                  className="text-lg"
                                  placeholder="Enter question..."
                                />
                              </div>

                              {/* Answers */}
                              <div className="space-y-3">
                                <Label className="text-sm text-muted-foreground">Answers (click to mark as correct)</Label>
                                <div className="grid gap-2">
                                  {question.answers.map((answer, answerIndex) => (
                                    <div key={answerIndex} className="flex items-center gap-2">
                                      <Button
                                        onClick={() => handleQuestionChange(index, "correctAnswer", answerIndex)}
                                        variant={question.correctAnswer === answerIndex ? "default" : "outline"}
                                        size="icon"
                                        className="shrink-0"
                                      >
                                        {question.correctAnswer === answerIndex ? (
                                          <Check className="w-4 h-4" />
                                        ) : (
                                          <span className="text-xs">{answerIndex + 1}</span>
                                        )}
                                      </Button>
                                      <Input
                                        value={answer}
                                        onChange={(e) => handleAnswerChange(index, answerIndex, e.target.value)}
                                        placeholder={`Answer ${answerIndex + 1}`}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Add Question Button */}
        <Button onClick={handleAddQuestion} variant="outline" className="w-full game-button" size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Add Question
        </Button>
      </div>
    </div>
  );
}
