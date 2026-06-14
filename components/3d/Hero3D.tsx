"use client";

/**
 * @file components/3d/Hero3D.tsx
 * @description React component for Hero3D.tsx under the 3d category.
 * 
 * @exports
 * - Hero3D (default): Main React component or function
 */

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
