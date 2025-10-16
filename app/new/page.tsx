"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSession } from "@/lib/game-store";
import { Sparkles, Gamepad2, ChevronDown, Heart, BookOpen, Users } from "lucide-react";
import { brands, BrandCode, SessionType } from "@/constants";

type GameMode = "ice-breaker" | "session-trivia" | "prayer-request";

export default function NewGamePage() {
  const router = useRouter();
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<{ code: BrandCode; data: (typeof brands)[BrandCode] } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<
    | {
        id: number;
        question: string;
        answers: string[];
        correctAnswer: number;
      }[]
    | null
  >(null);

  const gameModes = [
    {
      id: "ice-breaker" as GameMode,
      name: "Ice Breaker",
      description: "Fun questions to get to know each other",
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "session-trivia" as GameMode,
      name: "Session Trivia",
      description: "Bible study questions from your curriculum",
      icon: BookOpen,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      id: "prayer-request" as GameMode,
      name: "Prayer Request",
      description: "Share and pray for one another",
      icon: Heart,
      gradient: "from-orange-500 to-red-500",
    },
  ];

  const handleBrandSelect = async (brandCode: BrandCode, brandData: (typeof brands)[BrandCode]) => {
    if (selectedBrand?.code === brandCode) {
      // Close if clicking the same brand
      setIsExpanded(false);
      setTimeout(() => setSelectedBrand(null), 300);
    } else {
      setSelectedBrand({ code: brandCode, data: brandData });
      setIsExpanded(true);
    }
  };

  const handleSessionSelect = async (sessionType: SessionType) => {
    if (!selectedBrand) return;

    // Generate questions for session-trivia mode

    setGenerateError(null);
    setIsGenerating(true);
    setGeneratedQuestions(null);

    try {
      // Fetch ETB Session 1 text and send to API to generate questions
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "ETB_students_Session1.txt", questionCount: 5 }),
      });

      if (!res.ok) {
        throw new Error(`Generation failed (${res.status})`);
      }

      const data = await res.json();

      // Validate JSON structure
      if (!Array.isArray(data?.questions)) {
        throw new Error("Invalid response shape: questions not array");
      }

      data.questions.forEach((q: any, idx: number) => {
        if (
          typeof q?.question !== "string" ||
          !Array.isArray(q?.answers) ||
          q.answers.length !== 4 ||
          typeof q?.correctAnswer !== "number" ||
          q.correctAnswer < 0 ||
          q.correctAnswer > 3
        ) {
          throw new Error(`Invalid question at index ${idx}`);
        }
      });

      setGeneratedQuestions(data.questions);

      console.log("Generated questions:", selectedBrand.code, sessionType, "session-trivia", data.questions);

      // Create session with generated questions
      const code = createSession(selectedBrand.code, sessionType, "session-trivia", data.questions);

      // Store moderator flag
      localStorage.setItem("isModerator", "true");
      localStorage.setItem("sessionCode", code);

      // Route to edit questions page first
      router.push(`/new/edit/${code}`);
    } catch (err: any) {
      setGenerateError(err?.message || "Failed to generate questions");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrayerRequestStart = () => {
    const code = createSession(undefined, undefined, "prayer-request");

    // Store moderator flag
    localStorage.setItem("isModerator", "true");
    localStorage.setItem("sessionCode", code);

    // Route directly to session page for prayer request
    router.push(`/session/${code}`);
  };

  const activeBrands = Object.entries(brands) as [BrandCode, (typeof brands)[BrandCode]][];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 overflow-hidden">
      <div className="w-full max-w-6xl">
        {/* Game Mode Selection */}
        {!gameMode && (
          <div className="text-center space-y-8">
            <div className="flex justify-center mb-4 animate-bounce-in">
              <div className="p-4 bg-primary/10 rounded-full animate-pulse-glow">
                <Gamepad2 className="w-12 h-12 text-primary animate-float" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold animate-slide-up animate-delay-200">Choose Your Session Mode</h1>
              <p className="text-base animate-slide-up animate-delay-300 mt-2">Select how you want to connect with your group</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {gameModes.map((mode, index) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setGameMode(mode.id)}
                    className={`group relative bg-gradient-to-br ${mode.gradient} rounded-3xl p-8 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-pop-in cursor-pointer`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-3xl transition-colors duration-300" />
                    <div className="relative flex flex-col items-center text-center space-y-4">
                      <div className="p-4 bg-white/20 rounded-full">
                        <Icon className="w-12 h-12" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{mode.name}</h3>
                        <p className="text-white/90">{mode.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center mt-8">
              <Button onClick={() => router.push("/")} variant="ghost">
                Back to Home
              </Button>
            </div>
          </div>
        )}

        {/* Brand Selection - Only shown for Session Trivia */}
        {gameMode === "session-trivia" && (
          <>
            <div className="text-center space-y-2 mb-8">
              <div className="flex justify-center mb-4 animate-bounce-in">
                <div className="p-4 bg-primary/10 rounded-full animate-pulse-glow">
                  <Sparkles className="w-12 h-12 text-primary animate-float" />
                </div>
              </div>
              <h1 className="text-3xl font-bold animate-slide-up animate-delay-200">Select Your Brand</h1>
              <p className="text-base animate-slide-up animate-delay-300">Choose a brand to start your trivia session</p>
            </div>

            <div
              className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 transition-all duration-500 ${
                isExpanded ? "opacity-60 scale-95" : "opacity-100 scale-100"
              }`}
            >
              {activeBrands.map(([code, brand], index) => (
                <button
                  key={code}
                  onClick={() => handleBrandSelect(code, brand)}
                  className={`group relative aspect-square rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-pop-in ${
                    selectedBrand?.code === code ? "ring-4 ring-primary scale-105" : ""
                  }`}
                  style={{
                    background: brand.background,
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  <div className="relative h-full w-full flex items-center justify-center p-6">
                    <div className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto">
                      {brand.logo}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm font-semibold text-center">{brand.name}</p>
                  </div>
                  {selectedBrand?.code === code && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10">
                      <ChevronDown className="w-8 h-8 text-primary animate-bounce" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Error Indicator */}
            {generateError && (
              <div className="max-w-2xl mx-auto text-center mb-4 animate-slide-up">
                <div className="text-sm text-red-500">{generateError}</div>
              </div>
            )}

            <div
              className={`overflow-hidden transition-all duration-700 ease-in-out ${isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
            >
              {selectedBrand && (
                <div
                  className="relative rounded-3xl shadow-2xl p-8 mt-8"
                  style={{
                    background: selectedBrand.data.background,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60 rounded-3xl" />

                  <div className="relative z-10">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold mb-2 text-white">Choose Your Session</h2>
                      <p className="text-white/80">Select how you want to play {selectedBrand.data.name}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {selectedBrand.data.sessions.map((mode, index) => (
                        <button
                          key={mode.id}
                          onClick={() => handleSessionSelect(mode.id)}
                          className="group relative bg-white/10 backdrop-blur-md hover:bg-white/20 border-2 border-white/30 hover:border-white rounded-xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl"
                          style={{
                            animation: `slide-up 0.5s ease-out ${0.1 + index * 0.1}s both`,
                          }}
                          disabled={gameMode === "session-trivia" && isGenerating}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold mb-2 text-white group-hover:scale-105 transition-transform">{mode.name}</h3>
                              <p className="text-sm text-white/80">{mode.description}</p>
                              {gameMode === "session-trivia" && isGenerating && <p className="text-xs text-white/70 mt-2">Generating questions…</p>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-center">
                      <Button
                        onClick={() => {
                          setIsExpanded(false);
                          setTimeout(() => setSelectedBrand(null), 300);
                        }}
                        variant="outline"
                        className="game-button bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white backdrop-blur-md"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`flex justify-center mt-6 transition-opacity duration-300 ${isExpanded ? "opacity-0" : "opacity-100"}`}>
              <Button onClick={() => setGameMode(null)} variant="ghost" className="game-button animate-slide-up animate-delay-500">
                Back to Game Modes
              </Button>
            </div>
          </>
        )}

        {/* Ice Breaker Mode */}
        {gameMode === "ice-breaker" && (
          <div className="text-center space-y-8">
            <div className="flex justify-center mb-4 animate-bounce-in">
              <div className="p-4 bg-blue-500/20 rounded-full animate-pulse-glow">
                <Users className="w-12 h-12 text-blue-500 animate-float" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Ice Breaker Mode</h1>
              <p className="text-base mt-2">Coming soon!</p>
            </div>
            <div className="flex justify-center mt-8">
              <Button onClick={() => setGameMode(null)} variant="ghost" className="game-button">
                Back to Game Modes
              </Button>
            </div>
          </div>
        )}

        {/* Prayer Request Mode */}
        {gameMode === "prayer-request" && (
          <div className="text-center space-y-8">
            <div className="flex justify-center mb-4 animate-bounce-in">
              <div className="p-4 bg-orange-500/20 rounded-full animate-pulse-glow">
                <Heart className="w-12 h-12 text-orange-500 animate-float" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold animate-slide-up">Prayer Request Mode</h1>
              <p className="text-base mt-2 text-muted-foreground animate-slide-up animate-delay-200">
                Share prayer requests with your community and pray together
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-4 animate-slide-up animate-delay-300">
              <div className="bg-card/50 p-6 rounded-xl">
                <h3 className="font-semibold mb-2">How it works:</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li>• Each player submits a prayer request</li>
                  <li>• Players can choose to remain anonymous</li>
                  <li>• All requests appear on the moderator screen</li>
                  <li>• Pray together as a community</li>
                </ul>
              </div>
              <Button
                onClick={handlePrayerRequestStart}
                className="w-full text-lg h-14 font-semibold game-button animate-pop-in animate-delay-400"
                size="lg"
              >
                Start Prayer Request Session ✨
              </Button>
            </div>
            <div className="flex justify-center mt-8">
              <Button onClick={() => setGameMode(null)} variant="ghost" className="game-button">
                Back to Game Modes
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
