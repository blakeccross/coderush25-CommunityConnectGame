"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { type GameSession, QUESTIONS, nextQuestion } from "@/lib/game-store"
import { Clock, Check, X, Trophy, Users } from "lucide-react"
import { useRouter } from "next/navigation"

type ModeratorViewProps = {
  session: GameSession
}

export function ModeratorView({ session }: ModeratorViewProps) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState(30)
  const [showResults, setShowResults] = useState(false)
  const currentQuestion = QUESTIONS[session.currentQuestion]

  useEffect(() => {
    if (showResults) return

    const timer = setInterval(() => {
      const elapsed = Date.now() - (session.timerStartTime || Date.now())
      const remaining = Math.max(0, 30 - Math.floor(elapsed / 1000))
      setTimeLeft(remaining)

      if (remaining === 0) {
        setShowResults(true)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [session.timerStartTime, showResults])

  const handleNextQuestion = () => {
    nextQuestion(session.code)
    setShowResults(false)
    setTimeLeft(30)
  }

  const handleEndGame = () => {
    localStorage.removeItem("isModerator")
    localStorage.removeItem("sessionCode")
    router.push("/")
  }

  if (session.gameEnded) {
    // Final leaderboard
    const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score)

    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="max-w-2xl mx-auto space-y-6 py-8">
          <Card className="shadow-xl">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-accent/20 rounded-full">
                  <Trophy className="w-16 h-16 text-accent" />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold">Game Over!</CardTitle>
              <p className="text-xl text-muted-foreground">Final Scores</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedPlayers.map((player, index) => (
                <Card key={player.id} className={index === 0 ? "bg-accent/10 border-accent" : "bg-card/50"}>
                  <CardContent className="py-4 px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                            index === 0
                              ? "bg-accent text-accent-foreground"
                              : index === 1
                                ? "bg-secondary text-secondary-foreground"
                                : index === 2
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{player.name}</p>
                          {index === 0 && <p className="text-sm text-accent font-medium">Winner!</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">{player.score}</p>
                        <p className="text-sm text-muted-foreground">points</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button onClick={handleEndGame} className="w-full text-lg h-12 font-semibold mt-6" size="lg">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (showResults) {
    // Show results after timer ends
    const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score)

    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="max-w-2xl mx-auto space-y-6 py-8">
          <Card className="shadow-xl">
            <CardHeader className="text-center space-y-4">
              <CardTitle className="text-2xl font-bold">
                Question {session.currentQuestion + 1} of {QUESTIONS.length}
              </CardTitle>
              <p className="text-lg">{currentQuestion.question}</p>
              <div className="p-4 bg-accent/20 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-2">Correct Answer:</p>
                <p className="text-xl font-bold text-accent">
                  {currentQuestion.answers[currentQuestion.correctAnswer]}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Leaderboard */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Trophy className="w-5 h-5" />
                  <span>Current Standings</span>
                </div>

                <div className="grid gap-2">
                  {sortedPlayers.map((player, index) => {
                    const isCorrect = player.lastAnswer === currentQuestion.correctAnswer
                    const pointsEarned = isCorrect ? Math.max(0, 300 - Math.floor((player.answerTime || 0) / 100)) : 0

                    return (
                      <Card key={player.id} className="bg-card/50">
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{player.name}</p>
                                {isCorrect && pointsEarned > 0 && (
                                  <p className="text-xs text-accent">+{pointsEarned} pts</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg">{player.score}</span>
                              {isCorrect ? (
                                <Check className="w-5 h-5 text-accent" />
                              ) : (
                                <X className="w-5 h-5 text-destructive" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              <Button onClick={handleNextQuestion} className="w-full text-lg h-14 font-semibold" size="lg">
                {session.currentQuestion + 1 < QUESTIONS.length ? "Next Question" : "View Final Results"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Active question view
  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <Card className="shadow-xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">
                Question {session.currentQuestion + 1} of {QUESTIONS.length}
              </CardTitle>
              <div className="flex items-center gap-2 text-lg font-bold">
                <Clock className="w-5 h-5" />
                <span className={timeLeft <= 10 ? "text-destructive" : ""}>{timeLeft}s</span>
              </div>
            </div>

            <Progress value={(timeLeft / 30) * 100} className="h-2" />

            <p className="text-2xl font-bold text-center py-4">{currentQuestion.question}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Answer Options Display */}
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.answers.map((answer, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="py-4 px-4 text-center">
                    <p className="font-medium">{answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Player Status */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Users className="w-5 h-5" />
                <span>Player Status</span>
              </div>

              <div className="grid gap-2">
                {session.players.map((player, index) => (
                  <Card key={player.id} className="bg-card/50">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                            {index + 1}
                          </div>
                          <span className="font-medium">{player.name}</span>
                        </div>
                        {player.hasAnswered ? (
                          <Check className="w-5 h-5 text-accent" />
                        ) : (
                          <Clock className="w-5 h-5 text-muted-foreground animate-pulse" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
