"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { type GameSession, getSessionQuestions, nextQuestion, getPrayerRequests, endGame } from "@/lib/game-store";
import { Clock, Check, X, Trophy, Users, Heart } from "lucide-react";
import { useRouter } from "next/navigation";

type ModeratorViewProps = {
  session: GameSession;
};

export function ModeratorView({ session }: ModeratorViewProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(30);
  const [showResults, setShowResults] = useState(false);
  const questions = getSessionQuestions(session.code);
  const currentQuestion = questions[session.currentQuestion];

  useEffect(() => {
    if (showResults) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - (session.timerStartTime || Date.now());
      const remaining = Math.max(0, 30 - Math.floor(elapsed / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        setShowResults(true);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [session.timerStartTime, showResults]);

  const handleNextQuestion = () => {
    nextQuestion(session.code);
    setShowResults(false);
    setTimeLeft(30);
  };

  const handleEndGame = () => {
    endGame(session.code);
    localStorage.removeItem("isModerator");
    localStorage.removeItem("sessionCode");
    router.push("/");
  };

  // Prayer Request Mode
  if (session.gameMode === "prayer-request") {
    const prayerRequests = getPrayerRequests(session.code);
    const allPlayersSubmitted = session.players.every((p) => p.hasAnswered);

    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="max-w-4xl mx-auto space-y-6 py-8">
          <div className="animate-pop-in">
            <div className="text-center space-y-4">
              <div className="flex justify-center animate-bounce-in">
                <div className="p-4 bg-orange-500/20 rounded-full animate-pulse-glow">
                  <Heart className="w-12 h-12 text-orange-500 animate-float" />
                </div>
              </div>
              <h1 className="text-3xl font-bold animate-slide-up animate-delay-200">Prayer Requests</h1>
              <p className="text-muted-foreground animate-slide-up animate-delay-300">
                {allPlayersSubmitted
                  ? `All ${session.players.length} participants have submitted their requests`
                  : `${prayerRequests.length} of ${session.players.length} participants have submitted`}
              </p>
            </div>

            <div className="space-y-4">
              {prayerRequests.length === 0 ? (
                <div className="text-center py-12 animate-pulse">
                  <p className="text-muted-foreground">Waiting for prayer requests...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {prayerRequests.map((request, index) => (
                    <div
                      key={request.id}
                      className={`bg-card/50 p-6 rounded-xl border-2 border-border animate-slide-up animate-delay-${400 + index * 100}`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                              <Heart className="w-4 h-4 text-orange-500" />
                            </div>
                            <p className="font-semibold text-lg">{request.isAnonymous ? "Anonymous" : request.playerName}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{new Date(request.timestamp).toLocaleTimeString()}</p>
                        </div>
                        <p className="text-base text-foreground leading-relaxed pl-10">{request.request}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Users className="w-5 h-5" />
                  <span>Participant Status 👥</span>
                </div>

                <div className="grid gap-2">
                  {session.players.map((player, index) => (
                    <div key={player.id} className="bg-card/50 animate-slide-up">
                      <div className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-base">
                              {player.avatar ? (
                                <span className="text-lg leading-none">{player.avatar}</span>
                              ) : (
                                <span className="font-bold text-primary">{index + 1}</span>
                              )}
                            </div>
                            <span className="font-medium">{player.name}</span>
                          </div>
                          {player.hasAnswered ? (
                            <Check className="w-5 h-5 text-accent animate-pop-in" />
                          ) : (
                            <Clock className="w-5 h-5 text-muted-foreground animate-pulse" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleEndGame}
                className="w-full text-lg h-12 font-semibold mt-6 game-button animate-pop-in animate-delay-600"
                size="lg"
              >
                End Session ✨
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (session.gameEnded) {
    // Final leaderboard
    const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);

    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="max-w-2xl mx-auto space-y-6 py-8">
          <div className="shadow-xl animate-pop-in">
            <div className="text-center space-y-4">
              <div className="flex justify-center animate-bounce-in">
                <div className="p-4 bg-accent/20 rounded-full animate-pulse-glow">
                  <Trophy className="w-16 h-16 text-accent animate-float" />
                </div>
              </div>
              <h1 className="text-4xl font-bold animate-slide-up animate-delay-200">Game Over! 🎉</h1>
              <p className="text-xl text-muted-foreground animate-slide-up animate-delay-300">Final Scores 🏆</p>
            </div>
            <div className="space-y-4">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`animate-slide-up animate-delay-${400 + index * 100} ${index === 0 ? "bg-accent/10 border-accent" : "bg-card/50"}`}
                >
                  <div className="py-4 px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                          {player.avatar ? <span className="leading-none">{player.avatar}</span> : <span className="font-bold">{index + 1}</span>}
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{player.name}</p>
                          {index === 0 && <p className="text-sm text-accent font-medium">Winner! 🏆</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">{player.score}</p>
                        <p className="text-sm text-muted-foreground">points</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                onClick={handleEndGame}
                className="w-full text-lg h-12 font-semibold mt-6 game-button animate-pop-in animate-delay-600"
                size="lg"
              >
                Back to Home ✨
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    // Show results after timer ends
    const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);

    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="max-w-2xl mx-auto space-y-6 py-8">
          <div className="shadow-xl animate-pop-in">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold animate-bounce-in">
                Question {session.currentQuestion + 1} of {questions.length}
              </h1>
              <p className="text-lg animate-slide-up animate-delay-200">{currentQuestion.question}</p>
              <div className="p-4 bg-accent/20 rounded-lg animate-pop-in animate-delay-300">
                <p className="text-sm font-medium text-muted-foreground mb-2">Correct Answer:</p>
                <p className="text-xl font-bold text-accent">{currentQuestion.answers[currentQuestion.correctAnswer]}</p>
              </div>
            </div>
            <div className="space-y-6">
              {/* Current Leaderboard */}
              <div className="space-y-3 animate-slide-up animate-delay-400">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Trophy className="w-5 h-5" />
                  <span>Current Standings 📊</span>
                </div>

                <div className="grid gap-2">
                  {sortedPlayers.map((player, index) => {
                    const isCorrect = player.lastAnswer === currentQuestion.correctAnswer;
                    const pointsEarned = isCorrect ? Math.max(0, 300 - Math.floor((player.answerTime || 0) / 100)) : 0;

                    return (
                      <div key={player.id} className="bg-card/50 animate-slide-up">
                        <div className="py-3 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-base">
                                {player.avatar ? (
                                  <span className="text-lg leading-none">{player.avatar}</span>
                                ) : (
                                  <span className="font-bold text-primary">{index + 1}</span>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{player.name}</p>
                                {isCorrect && pointsEarned > 0 && <p className="text-xs text-accent">+{pointsEarned} pts</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg">{player.score}</span>
                              {isCorrect ? (
                                <Check className="w-5 h-5 text-accent animate-pop-in" />
                              ) : (
                                <X className="w-5 h-5 text-destructive animate-wiggle" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={handleNextQuestion}
                className="w-full text-lg h-14 font-semibold game-button animate-pulse-glow animate-pop-in animate-delay-500"
                size="lg"
              >
                {session.currentQuestion + 1 < questions.length ? "Next Question ➡️" : "View Final Results 🏆"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active question view
  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="shadow-xl animate-pop-in">
          <div className="space-y-4">
            <div className="flex items-center justify-between animate-slide-up animate-delay-100">
              <h1 className="text-xl font-bold">
                Question {session.currentQuestion + 1} of {questions.length}
              </h1>
              <div className="flex items-center gap-2 text-lg font-bold">
                <Clock className={`w-5 h-5 ${timeLeft <= 10 ? "animate-pulse" : ""}`} />
                <span className={timeLeft <= 10 ? "text-destructive animate-pulse" : ""}>{timeLeft}s</span>
              </div>
            </div>

            <Progress value={(timeLeft / 30) * 100} className="h-2 animate-slide-up animate-delay-200" />

            <p className="text-2xl font-bold text-center py-4 animate-bounce-in animate-delay-300">{currentQuestion.question}</p>
          </div>
          <div className="space-y-6">
            {/* Answer Options Display */}
            <div className="grid grid-cols-2 gap-3 animate-slide-up animate-delay-400">
              {currentQuestion.answers.map((answer, index) => (
                <div key={index} className="bg-muted/50 animate-pop-in">
                  <div className="py-4 px-4 text-center">
                    <p className="font-medium">{answer}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Player Status */}
            <div className="space-y-3 animate-slide-up animate-delay-500">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Users className="w-5 h-5" />
                <span>Player Status 👥</span>
              </div>

              <div className="grid gap-2">
                {session.players.map((player, index) => (
                  <div key={player.id} className="bg-card/50 animate-slide-up">
                    <div className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                            {index + 1}
                          </div>
                          <span className="font-medium">{player.name}</span>
                        </div>
                        {player.hasAnswered ? (
                          <Check className="w-5 h-5 text-accent animate-pop-in" />
                        ) : (
                          <Clock className="w-5 h-5 text-muted-foreground animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
