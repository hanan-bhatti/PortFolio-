import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins + set defaults client-side only. Both calls mutate
// GSAP's module-level state, so on the server they would (harmlessly today,
// but fragile) run on every RSC pre-render.
//
// IMPORT CONTRACT: this module is the single registration point for GSAP and
// its plugins. Every other module MUST import { gsap, ScrollTrigger } from
// "@/lib/gsap" — never directly from "gsap" / "gsap/ScrollTrigger". Importing
// the plugin elsewhere can load it before this side-effect runs, leaving
// ScrollTrigger unregistered. (Worth enforcing with an ESLint
// no-restricted-imports rule that exempts this file.)
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({
    ease: "power3.out",
    duration: 0.5,
  });
}

// Export configured gsap and plugins
export { gsap, ScrollTrigger };

// Animation configuration constants (from data)
export const ANIMATION_CONFIG = {
  duration: { base: 0.3, fast: 0.2, slow: 0.5 },
  ease: { default: "power3.out", snappy: "expo.out" },
  stagger: { default: 0.05, slow: 0.1 },
  delays: { default: 0.1, step: 0.1 },
} as const;
