"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { type GameSession, getSessionQuestions, submitAnswer, submitPrayerRequest } from "@/lib/game-store";
import { Check, X, Trophy, Clock, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import HeaderComponent from "./header-component";

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
  const [prayerRequest, setPrayerRequest] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const questions = getSessionQuestions(session.code);
  const currentQuestion = questions[session.currentQuestion];
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
      const remaining = Math.max(0, 15 - Math.floor(elapsed / 1000));
      setTimeLeft(remaining);

      if (remaining === 0 && !showResult) {
        setShowResult(true);
      }
      if (session.questionEnded && !showResult) {
        setTimeLeft(0);
        setShowResult(true);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [session.timerStartTime, session.questionEnded, showResult]);

  useEffect(() => {
    if (session.questionEnded && !showResult) {
      setTimeLeft(0);
      setShowResult(true);
    }
  }, [session.questionEnded, showResult]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (hasSubmitted || showResult) return;

    setSelectedAnswer(answerIndex);
    submitAnswer(session.code, playerId, answerIndex);
    setHasSubmitted(true);
  };

  const handlePrayerRequestSubmit = () => {
    if (!prayerRequest.trim() || hasSubmitted) return;

    const playerName = localStorage.getItem("playerName") || "Anonymous";
    submitPrayerRequest(session.code, playerId, playerName, prayerRequest.trim(), isAnonymous);
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

  // Prayer Request Mode
  if (session.gameMode === "prayer-request") {
    if (hasSubmitted || player.hasAnswered) {
      return (
        <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
          <div className="max-w-md mx-auto space-y-6 py-8">
            <div className="animate-pop-in">
              <div className="text-center space-y-4">
                <div className="flex justify-center animate-bounce-in">
                  <div className="p-4 bg-accent/20 rounded-full animate-pulse-glow">
                    <Check className="w-16 h-16 text-accent animate-float" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold animate-slide-up animate-delay-200">Prayer Request Submitted! 🙏</h1>
                <p className="text-muted-foreground animate-slide-up animate-delay-300">Your prayer request has been shared with the moderator</p>
                <p className="text-sm text-muted-foreground animate-pulse animate-delay-400">Waiting for other participants...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="max-w-md mx-auto space-y-6 py-8">
          <div className="animate-pop-in">
            <div className="text-center space-y-2 mb-4">
              <div className="flex justify-center animate-bounce-in">
                <div className="p-4 bg-orange-500/20 rounded-full animate-pulse-glow">
                  <Heart className="w-12 h-12 text-orange-500 animate-float" />
                </div>
              </div>
              <h1 className="text-2xl font-bold animate-slide-up animate-delay-200">Share Your Prayer Request</h1>
              <p className="text-sm text-muted-foreground animate-slide-up animate-delay-300">
                Your request will be shared with your community for prayer
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2 animate-slide-up animate-delay-400">
                <label htmlFor="prayer-request" className="text-sm font-medium">
                  Prayer Request
                </label>
                <Textarea
                  id="prayer-request"
                  placeholder="Share what's on your heart..."
                  value={prayerRequest}
                  onChange={(e) => setPrayerRequest(e.target.value)}
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">{prayerRequest.length}/500</p>
              </div>

              <div className="flex items-center space-x-2 animate-slide-up animate-delay-500">
                <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={(checked) => setIsAnonymous(checked as boolean)} />
                <label htmlFor="anonymous" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Submit anonymously (your name won't be shown)
                </label>
              </div>

              <Button
                onClick={handlePrayerRequestSubmit}
                disabled={!prayerRequest.trim()}
                className="w-full text-lg h-12 font-semibold game-button animate-pop-in animate-delay-600"
                size="lg"
              >
                Submit Prayer Request 🙏
              </Button>
            </div>
          </div>
        </div>
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
          <div className="animate-pop-in">
            <div className="text-center space-y-4">
              <div className="flex justify-center animate-bounce-in">
                <div className="p-4 bg-accent/20 rounded-full animate-pulse-glow">
                  <Trophy className="w-16 h-16 text-accent animate-float" />
                </div>
              </div>
              <h1 className="text-3xl font-bold animate-slide-up animate-delay-200">Game Over! 🎉</h1>
              <div className="space-y-2 animate-slide-up animate-delay-300 mb-4">
                <p className="text-5xl font-bold text-primary">{player.score}</p>
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
      <HeaderComponent showResult={true}>
        <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
          <div className="max-w-md mx-auto space-y-6 py-8">
            <div className="animate-pop-in">
              <div className="text-center space-y-4 mb-4">
                <div className="flex justify-center animate-bounce-in">
                  <div className={`p-4 rounded-full animate-pulse-glow ${isCorrect ? "bg-white/80" : "bg-destructive/20"}`}>
                    {isCorrect ? <Check className="w-16 h-16 text-green-600" /> : <X className="w-16 h-16 text-destructive" />}
                  </div>
                </div>
                <h1 className="text-3xl font-bold animate-slide-up animate-delay-200">{isCorrect ? "Correct!" : "Incorrect"}</h1>
                {isCorrect && pointsEarned > 0 && (
                  <p className="text-2xl font-bold text-white animate-pop-in animate-delay-300">+{pointsEarned} points</p>
                )}
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center animate-slide-up animate-delay-400">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Correct Answer:</p>
                  <p className="text-2xl font-bold">{currentQuestion.answers[currentQuestion.correctAnswer]}</p>
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
      </HeaderComponent>
    );
  }

  // Active question - player answering
  return (
    <HeaderComponent showResult={false}>
      <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="max-w-md mx-auto space-y-6 py-8">
          <div className="animate-pop-in">
            <div className="space-y-4">
              <div className="flex items-center justify-between animate-slide-up animate-delay-100">
                <h1 className="text-lg font-bold">
                  Question {session.currentQuestion + 1}/{questions.length}
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
            </div>
          </div>
        </div>
      </div>
    </HeaderComponent>
  );
}
