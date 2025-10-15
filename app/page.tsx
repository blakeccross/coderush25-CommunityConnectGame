"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { joinSession } from "@/lib/game-store";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Check for invite code in query params
    const inviteCode = searchParams.get("code");
    if (inviteCode) {
      setCode(inviteCode.toUpperCase());
    }
  }, [searchParams]);

  const handleJoin = () => {
    if (!code || code.length !== 4) {
      setError("Please enter a valid 4-letter code");
      return;
    }

    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    const player = joinSession(code.toUpperCase(), playerName.trim());

    if (!player) {
      setError("Session not found or game already started");
      return;
    }

    // Store player info in localStorage
    localStorage.setItem("playerId", player.id);
    localStorage.setItem("playerName", player.name);

    router.push(`/session/${code.toUpperCase()}?player=${player.id}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-4xl font-bold">Small Group Connect</CardTitle>
          <CardDescription className="text-base">Enter the game code to join the fun!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              Game Code
            </label>
            <Input
              id="code"
              placeholder="ABCD"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().slice(0, 4));
                setError("");
              }}
              maxLength={4}
              className="text-center text-2xl font-bold tracking-widest uppercase"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Your Name
            </label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setError("");
              }}
              maxLength={20}
            />
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button onClick={handleJoin} className="w-full text-lg h-12 font-semibold" size="lg">
            Join Game
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button onClick={() => router.push("/new")} variant="outline" className="w-full text-lg h-12 font-semibold" size="lg">
            Create New Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
