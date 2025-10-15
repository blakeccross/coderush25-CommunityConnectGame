"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createSession } from "@/lib/game-store"
import { Sparkles } from "lucide-react"

export default function NewGamePage() {
  const router = useRouter()

  const handleCreateSession = () => {
    const code = createSession()

    // Store moderator flag
    localStorage.setItem("isModerator", "true")
    localStorage.setItem("sessionCode", code)

    router.push(`/session/${code}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Create New Game</CardTitle>
          <CardDescription className="text-base">Start a new trivia session and invite your friends!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleCreateSession} className="w-full text-lg h-14 font-semibold" size="lg">
            Create Session
          </Button>

          <Button onClick={() => router.push("/")} variant="ghost" className="w-full">
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
