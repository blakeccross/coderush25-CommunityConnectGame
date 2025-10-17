import { PropsWithChildren, useState } from "react";

type HeaderProps = {
  showResult: boolean;
};

export default function MorphDemo({ showResult, children }: PropsWithChildren<HeaderProps>) {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-background" />

      <div
        className="absolute inset-x-0 top-0 transition-all duration-1000 ease-in-out"
        style={{
          background: "linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)",
          height: showResult ? "95%" : "10%",
          zIndex: 10,
        }}
      >
        <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 400 100" preserveAspectRatio="none" style={{ height: "100px" }}>
          <path
            d={
              showResult
                ? "M 0 0 Q 200 100 400 0 L 400 100 L 0 100 Z" // Concave - dips inward
                : "M 0 100 Q 200 0 400 100 L 400 100 L 0 100 Z" // Convex - bulges outward
            }
            className="transition-all duration-1000 ease-in-out fill-background"
          />
        </svg>

        <div className="relative" style={{ zIndex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
