"use client";

import dynamic from "next/dynamic";
import { ThreeErrorBoundary } from "./ThreeErrorBoundary";
import type { HeroVariant } from "./HeroScenes";

const HeroScene = dynamic(() => import("./HeroScenes"), { ssr: false, loading: () => null });

export default function Hero3D({ variant, className }: { variant: HeroVariant; className?: string }) {
  return (
    <div className={className} aria-hidden>
      <ThreeErrorBoundary>
        <HeroScene variant={variant} />
      </ThreeErrorBoundary>
    </div>
  );
}
