"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSession } from "@/lib/game-store";
import { Sparkles, Gamepad2, ChevronDown } from "lucide-react";
import { brands, BrandCode, GameMode } from "@/constants";

export default function NewGamePage() {
  const router = useRouter();
  const [selectedBrand, setSelectedBrand] = useState<{ code: BrandCode; data: (typeof brands)[BrandCode] } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleBrandSelect = (brandCode: BrandCode, brandData: (typeof brands)[BrandCode]) => {
    if (selectedBrand?.code === brandCode) {
      // Close if clicking the same brand
      setIsExpanded(false);
      setTimeout(() => setSelectedBrand(null), 300);
    } else {
      setSelectedBrand({ code: brandCode, data: brandData });
      setIsExpanded(true);
    }
  };

  const handleGameModeSelect = (gameMode: GameMode) => {
    if (!selectedBrand) return;

    const code = createSession(selectedBrand.code, gameMode);

    // Store moderator flag
    localStorage.setItem("isModerator", "true");
    localStorage.setItem("sessionCode", code);

    router.push(`/session/${code}`);
  };

  const activeBrands = Object.entries(brands) as [BrandCode, (typeof brands)[BrandCode]][];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 overflow-hidden">
      <div className="w-full max-w-6xl">
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

        <div className={`overflow-hidden transition-all duration-700 ease-in-out ${isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
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
                  <div className="flex justify-center items-center gap-4 mb-4">
                    <div className="w-32 h-32 flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto">
                      {selectedBrand.data.logo}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-white">Choose Your Session</h2>
                  <p className="text-white/80">Select how you want to play {selectedBrand.data.name}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {selectedBrand.data.gameModes.map((mode, index) => (
                    <button
                      key={mode.id}
                      onClick={() => handleGameModeSelect(mode.id)}
                      className="group relative bg-white/10 backdrop-blur-md hover:bg-white/20 border-2 border-white/30 hover:border-white rounded-xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl"
                      style={{
                        animation: `slide-up 0.5s ease-out ${0.1 + index * 0.1}s both`,
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2 text-white group-hover:scale-105 transition-transform">{mode.name}</h3>
                          <p className="text-sm text-white/80">{mode.description}</p>
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
          <Button onClick={() => router.push("/")} variant="ghost" className="game-button animate-slide-up animate-delay-500">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
