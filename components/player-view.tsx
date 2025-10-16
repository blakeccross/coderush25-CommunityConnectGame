"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { type GameSession, QUESTIONS, submitAnswer } from "@/lib/game-store";
import { Check, X, Trophy, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

type PlayerViewProps = {
  session: GameSession;
  playerId: string;
};

export function PlayerView({ session, playerId }: PlayerViewProps) {
  const router = useRouter();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const currentQuestion = QUESTIONS[session.currentQuestion];
  const player = session.players.find((p) => p.id === playerId);

  useEffect(() => {
    // Reset state when question changes
    setSelectedAnswer(null);
    setHasSubmitted(false);
    setShowResult(false);
    setTimeLeft(30);
  }, [session.currentQuestion]);

  useEffect(() => {
    // Timer
    const timer = setInterval(() => {
      const elapsed = Date.now() - (session.timerStartTime || Date.now());
      const remaining = Math.max(0, 30 - Math.floor(elapsed / 1000));
      setTimeLeft(remaining);

      if (remaining === 0 && !showResult) {
        setShowResult(true);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [session.timerStartTime, showResult]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (hasSubmitted || showResult) return;

    setSelectedAnswer(answerIndex);
    submitAnswer(session.code, playerId, answerIndex);
    setHasSubmitted(true);
  };

  const handleEndGame = () => {
    localStorage.removeItem("playerId");
    localStorage.removeItem("playerName");
    router.push("/");
  };

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Player not found</p>
      </div>
    );
  }

  if (session.gameEnded) {
    // Final score for player
    const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);
    const playerRank = sortedPlayers.findIndex((p) => p.id === playerId) + 1;

    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="max-w-md mx-auto space-y-6 py-8">
          <div className="shadow-xl animate-pop-in">
            <div className="text-center space-y-4">
              <div className="flex justify-center animate-bounce-in">
                <div className="p-4 bg-accent/20 rounded-full animate-pulse-glow">
                  <Trophy className="w-16 h-16 text-accent animate-float" />
                </div>
              </div>
              <h1 className="text-3xl font-bold animate-slide-up animate-delay-200">Game Over! 🎉</h1>
              <div className="space-y-2 animate-slide-up animate-delay-300">
                <p className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  {player.score}
                </p>
                <p className="text-lg text-muted-foreground">points</p>
                <p className="text-xl font-semibold">
                  {playerRank === 1 ? "🏆 You Won!" : `${playerRank}${playerRank === 2 ? "nd" : playerRank === 3 ? "rd" : "th"} Place`}
                </p>
              </div>
            </div>
            <div>
              <Button onClick={handleEndGame} className="w-full text-lg h-12 font-semibold game-button animate-pop-in animate-delay-400" size="lg">
                Back to Home ✨
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResult) {
    // Show if answer was correct or incorrect
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const pointsEarned = isCorrect && player.answerTime ? Math.max(0, 300 - Math.floor(player.answerTime / 100)) : 0;

    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="max-w-md mx-auto space-y-6 py-8">
          <div className="shadow-xl animate-pop-in">
            <div className="text-center space-y-4">
              <div className="flex justify-center animate-bounce-in">
                <div className={`p-4 rounded-full animate-pulse-glow ${isCorrect ? "bg-accent/20" : "bg-destructive/20"}`}>
                  {isCorrect ? <Check className="w-16 h-16 text-accent" /> : <X className="w-16 h-16 text-destructive" />}
                </div>
              </div>
              <h1 className="text-3xl font-bold animate-slide-up animate-delay-200">{isCorrect ? "Correct! ✅" : "Incorrect ❌"}</h1>
              {isCorrect && pointsEarned > 0 && (
                <p className="text-2xl font-bold text-accent animate-pop-in animate-delay-300">+{pointsEarned} points</p>
              )}
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center animate-slide-up animate-delay-400">
                <p className="text-sm font-medium text-muted-foreground mb-2">Correct Answer:</p>
                <p className="text-lg font-bold">{currentQuestion.answers[currentQuestion.correctAnswer]}</p>
              </div>

              <div className="text-center animate-slide-up animate-delay-500">
                <p className="text-sm text-muted-foreground mb-1">Your Score</p>
                <p className="text-4xl font-bold">{player.score}</p>
              </div>

              <p className="text-center text-muted-foreground animate-pulse animate-delay-600">Waiting for next question...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active question - player answering
  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      <div className="max-w-md mx-auto space-y-6 py-8">
        <div className="shadow-xl animate-pop-in">
          <div className="space-y-4">
            <div className="flex items-center justify-between animate-slide-up animate-delay-100">
              <h1 className="text-lg font-bold">
                Question {session.currentQuestion + 1}/{QUESTIONS.length}
              </h1>
              <div className="flex items-center gap-2 text-lg font-bold">
                <Clock className={`w-5 h-5 ${timeLeft <= 10 ? "animate-pulse" : ""}`} />
                <span className={timeLeft <= 10 ? "text-destructive animate-pulse" : ""}>{timeLeft}s</span>
              </div>
            </div>

            <p className="text-xl font-bold text-center py-4 text-balance animate-bounce-in animate-delay-200">{currentQuestion.question}</p>
          </div>
          <div className="space-y-4">
            {hasSubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="flex justify-center animate-pop-in">
                  <div className="p-4 bg-accent/20 rounded-full animate-pulse-glow">
                    <Check className="w-12 h-12 text-accent" />
                  </div>
                </div>
                <p className="text-lg font-semibold animate-slide-up animate-delay-200">Answer Submitted! ✓</p>
                <p className="text-muted-foreground animate-pulse animate-delay-300">Waiting for other players...</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {currentQuestion.answers.map((answer, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    variant="outline"
                    className={`h-auto py-4 px-6 text-left justify-start text-base font-medium game-button animate-slide-up animate-delay-${
                      300 + index * 100
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-balance">{answer}</span>
                  </Button>
                ))}
              </div>
            )}

            <div className="pt-4 text-center animate-slide-up animate-delay-600">
              <p className="text-sm text-muted-foreground mb-1">Your Score</p>
              <p className="text-2xl font-bold">{player.score}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
