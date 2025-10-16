"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinSession } from "@/lib/game-store";
import { motion } from "framer-motion";

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
    <div className="min-h-screen flex justify-center p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 relative overflow-hidden">
      {/* {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 border-[100px] border-primary/10 dark:border-white/10 rounded-full pointer-events-none"
          style={{
            x: "-50%",
            y: "-50%",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 8],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            delay: i * 2.25,
            ease: "easeOut",
          }}
        />
      ))} */}

      <div className="w-full max-w-md animate-pop-in relative z-10 mt-24">
        <div className="text-center space-y-2">
          <img src="/logos/ministrygo_logo.svg" alt="MinistryGo" className=" w-48 h-auto mx-auto" />

          <p className="text-base animate-slide-up animate-delay-200 text-muted-foreground">Enter the session code to join</p>
        </div>
        <div className="space-y-4 p-6">
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
              className="text-center text-2xl font-bold tracking-widest uppercase transition-transform hover:scale-105"
            />
          </div>

          <div className="space-y-2 ">
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
              className="transition-transform hover:scale-105"
            />
          </div>

          {error && <p className="text-sm text-destructive text-center animate-wiggle">{error}</p>}

          <Button
            onClick={handleJoin}
            className="w-full text-lg h-12 font-semibold game-button animate-pop-in animate-delay-500 animate-pulse-glow"
            size="lg"
          >
            Join Game
          </Button>

          <div className="relative animate-slide-up animate-delay-600">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            onClick={() => router.push("/new")}
            variant="outline"
            className="w-full text-lg h-12 font-semibold game-button animate-pop-in animate-delay-600"
            size="lg"
          >
            Create New Game
          </Button>
        </div>
      </div>
    </div>
  );
}
