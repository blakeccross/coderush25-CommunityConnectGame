"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSession, subscribeToSession, startGame, type GameSession } from "@/lib/game-store";
import { QRCodeSVG } from "qrcode.react";
import { Users, Play, Check, Clock } from "lucide-react";
import { ModeratorView } from "@/components/moderator-view";
import { PlayerView } from "@/components/player-view";

export default function SessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = params.code as string;
  const playerId = searchParams.get("player");

  const [session, setSession] = useState<GameSession | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");

  useEffect(() => {
    // If there's a player query parameter, they are definitely a player (not moderator)
    if (playerId) {
      setIsModerator(false);
    } else {
      // Only check moderator status if there's no player parameter
      const moderatorFlag = localStorage.getItem("isModerator") === "true";
      const storedCode = localStorage.getItem("sessionCode");
      setIsModerator(moderatorFlag && storedCode === code);
    }

    // Get initial session
    const initialSession = getSession(code);
    if (!initialSession) {
      router.push("/");
      return;
    }
    setSession(initialSession);

    // Set invite URL
    if (typeof window !== "undefined") {
      setInviteUrl(`${window.location.origin}/?code=${code}`);
    }

    // Subscribe to updates
    const unsubscribe = subscribeToSession(code, (updatedSession) => {
      setSession(updatedSession);
    });

    return unsubscribe;
  }, [code, router, playerId]);

  const handleStartGame = () => {
    if (session && session.players.length > 0) {
      startGame(code);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show game interface if game has started
  if (session.gameStarted) {
    if (isModerator) {
      return <ModeratorView session={session} />;
    } else if (playerId) {
      return <PlayerView session={session} playerId={playerId} />;
    }
  }

  // Show lobby
  if (isModerator) {
    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="max-w-4xl mx-auto space-y-6 py-8">
          <div className="shadow-xl animate-pop-in">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold animate-bounce-in">Game Lobby 🎯</h1>
              <div className="flex items-center justify-center gap-2 animate-slide-up animate-delay-200">
                <span className="text-muted-foreground">Game Code:</span>
                <span className="text-4xl font-bold tracking-widest bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-float">
                  {code}
                </span>
              </div>
            </div>
            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex flex-col items-center gap-4 p-6 bg-muted/50 rounded-lg animate-slide-up animate-delay-300">
                <p className="text-sm font-medium text-muted-foreground">Scan to join</p>
                <div className="bg-white p-4 rounded-lg animate-pulse-glow">
                  <QRCodeSVG value={inviteUrl} size={200} />
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-xs">Players can scan this QR code or enter the code manually</p>
              </div>

              {/* Players List */}
              <div className="space-y-3 animate-slide-up animate-delay-400">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Users className="w-5 h-5" />
                  <span>Players ({session.players.length})</span>
                </div>

                {session.players.length === 0 ? (
                  <div className="bg-muted/30">
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground animate-pulse">Waiting for players to join...</p>
                    </div>
                  </div>
                ) : (
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
                            <Check className="w-5 h-5 text-accent animate-pop-in" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Start Button */}
              <Button
                onClick={handleStartGame}
                disabled={session.players.length === 0}
                className="w-full text-lg h-14 font-semibold game-button animate-pop-in animate-delay-500 animate-pulse-glow"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Game 🚀
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Player lobby view
  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      <div className="max-w-md mx-auto space-y-6 py-8">
        <div className="shadow-xl animate-pop-in">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold animate-bounce-in">Waiting to Start ⏳</h1>
            <div className="flex items-center justify-center gap-2 animate-slide-up animate-delay-200">
              <span className="text-muted-foreground">Game Code:</span>
              <span className="text-3xl font-bold tracking-widest bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-float">
                {code}
              </span>
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-3 animate-slide-up animate-delay-300">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Users className="w-5 h-5" />
                <span>Players ({session.players.length})</span>
              </div>

              <div className="grid gap-2">
                {session.players.map((player, index) => (
                  <div key={player.id} className="bg-card/50 animate-slide-up">
                    <div className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">{index + 1}</div>
                        <span className="font-medium">{player.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center py-8 animate-slide-up animate-delay-400">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5 animate-pulse" />
                <span>Waiting for host to start the game...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
