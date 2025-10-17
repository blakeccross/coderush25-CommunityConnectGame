"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { type GameSession, getSessionQuestions, nextQuestion, getPrayerRequests, endGame, startPrayerMode } from "@/lib/game-store";
import { Clock, Check, X, Trophy, Users, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, LayoutGroup } from "framer-motion";
import Header from "@/components/header-component";
import { Badge } from "./ui/badge";

type ModeratorViewProps = {
  session: GameSession;
};

export function ModeratorView({ session }: ModeratorViewProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(15);
  const [showResults, setShowResults] = useState(false);
  const [reorderToNew, setReorderToNew] = useState(false);
  const questions = getSessionQuestions(session.code);
  const currentQuestion = questions[session.currentQuestion];

  useEffect(() => {
    if (showResults || session.questionEnded) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - (session.timerStartTime || Date.now());
      const remaining = Math.max(0, 15 - Math.floor(elapsed / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        setShowResults(true);
      }
      if (session.questionEnded) {
        setTimeLeft(0);
        setShowResults(true);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [session.timerStartTime, session.questionEnded, showResults]);

  useEffect(() => {
    if (session.questionEnded && !showResults) {
      setTimeLeft(0);
      setShowResults(true);
    }
  }, [session.questionEnded, showResults]);

  useEffect(() => {
    if (!showResults) return;
    setReorderToNew(false);
    const timer = setTimeout(() => setReorderToNew(true), 1000);
    return () => clearTimeout(timer);
  }, [showResults]);

  const handleNextQuestion = () => {
    nextQuestion(session.code);
    setShowResults(false);
    setTimeLeft(15);
  };

  const handleEndGame = () => {
    endGame(session.code);
    localStorage.removeItem("isModerator");
    localStorage.removeItem("sessionCode");
    router.push("/");
  };

  // Prayer Request Mode
  if (session.gameMode === "prayer-request") {
    const prayerRequests = getPrayerRequests(session.code)
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp);
    const allPlayersSubmitted = session.players.every((p) => p.hasAnswered);

    return (
      <Header showResult>
        <div className="min-h-screen p-4">
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
                  <div className="space-y-4 max-h-[calc(70vh-200px)] overflow-y-auto">
                    {prayerRequests.map((request, index) => (
                      <div
                        key={request.id}
                        className={`bg-card/50 p-4 rounded-xl border-2 border-border animate-slide-up animate-delay-${400 + index * 100}`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                              <Heart className="w-4 h-4 text-orange-500" />
                            </div>
                            <div className="flex-1 items-start">
                              <p className="font-semibold text-lg">{request.isAnonymous ? "Anonymous" : request.playerName}</p>
                              <p className="text-base text-foreground leading-relaxed">{request.request}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">{new Date(request.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

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
      </Header>
    );
  }

  if (session.gameEnded) {
    // Final leaderboard
    const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);
    const topThree = sortedPlayers.slice(0, 3);
    const [first, second, third] = topThree;

    return (
      <Header showResult>
        <div className="min-h-screen p-4">
          <div className="max-w-2xl mx-auto space-y-6 py-8">
            <div className="animate-pop-in">
              <div className="text-center space-y-4">
                <div className="flex justify-center animate-bounce-in">
                  <div className="p-4 bg-background rounded-full animate-pulse-glow">
                    <Trophy className="w-16 h-16 text-accent animate-float" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold animate-slide-up animate-delay-200">Game Over! 🎉</h1>
                <p className="text-xl text-muted-foreground animate-slide-up animate-delay-300">Final Scores 🏆</p>
              </div>
              <div className="space-y-6 mt-4">
                <div className="flex items-end justify-center gap-6 animate-slide-up animate-delay-400">
                  {second && (
                    <div className="flex flex-col items-center">
                      <div className="text-sm font-medium text-muted-foreground mb-1">2nd</div>
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-7xl mb-2">
                        {second.avatar ? <span className="leading-none">{second.avatar}</span> : <span className="font-bold">2</span>}
                      </div>
                      <div className="w-28 h-24 bg-card/50 border-2 border-border rounded-t-xl flex flex-col items-center justify-end pb-3">
                        <p className="text-lg font-bold">{second.score}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-center max-w-[7rem] truncate">{second.name}</p>
                    </div>
                  )}

                  {first && (
                    <div className="flex flex-col items-center">
                      <div className="text-sm font-medium text-muted-foreground mb-1">1st</div>
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-7xl mb-2">
                        {first.avatar ? <span className="leading-none">{first.avatar}</span> : <span className="font-bold">1</span>}
                      </div>
                      <div className="w-32 h-32 bg-card/50 border-2 border-border rounded-t-xl flex flex-col items-center justify-end pb-3">
                        <p className="text-2xl font-bold">{first.score}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-center max-w-[8rem] truncate">{first.name}</p>
                    </div>
                  )}

                  {third && (
                    <div className="flex flex-col items-center">
                      <div className="text-sm font-medium text-muted-foreground mb-1">3rd</div>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-7xl mb-2">
                        {third.avatar ? <span className="leading-none">{third.avatar}</span> : <span className="font-bold">3</span>}
                      </div>
                      <div className="w-28 h-16 bg-card/50 border-2 border-border rounded-t-xl flex flex-col items-center justify-end pb-3">
                        <p className="text-lg font-bold">{third.score}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-center max-w-[7rem] truncate">{third.name}</p>
                    </div>
                  )}
                </div>

                <div className="grid gap-3 mt-8">
                  <Button
                    onClick={() => startPrayerMode(session.code)}
                    className="w-full text-lg h-12 font-semibold game-button animate-pop-in animate-delay-600"
                    size="lg"
                  >
                    Start Prayer Mode 🙏
                  </Button>
                  <Button onClick={handleEndGame} variant="outline" className="w-full text-lg h-12 font-semibold" size="lg">
                    Back to Home ✨
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Header>
    );
  }

  if (showResults) {
    // Show results after timer ends
    const computed = session.players.map((p) => {
      const isCorrect = p.lastAnswer === currentQuestion.correctAnswer;
      const pointsEarned = isCorrect ? Math.max(0, 300 - Math.floor((p.answerTime || 0) / 100)) : 0;
      return { ...p, pointsEarned, prevScore: (p.score || 0) - pointsEarned };
    });

    const finalSorted = [...computed].sort((a, b) => b.score - a.score);
    const finalTop20 = finalSorted.slice(0, 20);
    const initialOrder = [...finalTop20].sort((a, b) => b.prevScore - a.prevScore);
    const showing = reorderToNew ? finalTop20 : initialOrder;

    return (
      <Header showResult>
        <div className="min-h-screen p-4">
          <div className="max-w-2xl mx-auto space-y-6 py-8">
            <div className="animate-pop-in space-y-6">
              <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold animate-bounce-in">
                  Question {session.currentQuestion + 1} of {questions.length}
                </h1>
                <p className="text-lg animate-slide-up animate-delay-200">{currentQuestion.question}</p>
                <div className="p-4 bg-white/10 rounded-lg animate-pop-in animate-delay-300">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Correct Answer:</p>
                  <p className="text-2xl font-bold text-white dark:text-black">{currentQuestion.answers[currentQuestion.correctAnswer]}</p>
                </div>
              </div>
              <div className="space-y-6">
                {/* Current Leaderboard */}
                <div className="space-y-3 animate-slide-up animate-delay-400 max-h-[calc(70vh-200px)] overflow-y-auto">
                  {/* <div className="flex items-center gap-2 text-lg font-semibold">
                    <Trophy className="w-5 h-5" />
                    <span>Current Standings 📊</span>
                  </div> */}

                  <LayoutGroup>
                    <div className="grid gap-2">
                      {showing.map((player, index) => {
                        const isCorrect = player.lastAnswer === currentQuestion.correctAnswer;
                        const pointsEarned = player.pointsEarned as number;
                        return (
                          <motion.div key={player.id} layout layoutId={player.id} className="bg-card/50 rounded-4xl animate-slide-up">
                            <div className="py-2 px-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-base">{index + 1}</div>
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-base">
                                    {player.avatar ? (
                                      <span className="text-lg leading-none">{player.avatar}</span>
                                    ) : (
                                      <span className="font-bold text-primary">{index + 1}</span>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium">{player.name}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {pointsEarned > 0 && <Badge variant="default">{pointsEarned > 0 ? `+${pointsEarned} pts` : ""}</Badge>}
                                  <span className="font-bold text-lg">{player.score}</span>
                                  {isCorrect ? (
                                    <Check className="w-5 h-5 text-green-600 animate-pop-in" />
                                  ) : (
                                    <X className="w-5 h-5 text-destructive animate-wiggle" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </LayoutGroup>
                </div>

                <Button
                  onClick={handleNextQuestion}
                  className="w-full text-lg h-14 font-semibold game-button animate-pulse-glow animate-pop-in animate-delay-500"
                  size="lg"
                  variant="outline"
                >
                  {session.currentQuestion + 1 < questions.length ? "Next Question" : "View Final Results 🏆"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Header>
    );
  }

  // Active question view

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="animate-pop-in">
          <div className="space-y-4">
            <div className="flex items-center justify-between animate-slide-up animate-delay-100">
              <h1 className="text-xl font-bold">
                Question {session.currentQuestion + 1} of {questions.length}
              </h1>
              <div className="flex items-center gap-2 text-lg font-bold">
                <Clock className={`w-5 h-5 ${timeLeft <= 5 ? "animate-pulse" : ""}`} />
                <span className={timeLeft <= 5 ? "text-destructive animate-pulse" : ""}>{timeLeft}s</span>
              </div>
            </div>

            <Progress value={(timeLeft / 15) * 100} className="h-2 animate-slide-up animate-delay-200" />

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
                {session.players
                  .filter((p) => !p.hasAnswered)
                  .slice(0, 10)
                  .map((player, index) => (
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
