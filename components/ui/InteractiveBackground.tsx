"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function InteractiveBackground() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bg = bgRef.current;
    if (!bg) return;

    // Use GSAP ticker or a quickTo for super fast mouse tracking
    const xTo = gsap.quickTo(bg, "--mouse-x", { duration: 0.8, ease: "power3" });
    const yTo = gsap.quickTo(bg, "--mouse-y", { duration: 0.8, ease: "power3" });

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate mouse position as a percentage of the window
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      xTo(x);
      yTo(y);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#0a0a0a]">
      {/* Dynamic spotlight gradient */}
      <div
        ref={bgRef}
        className="absolute inset-0 opacity-40 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle 800px at calc(var(--mouse-x, 50) * 1%) calc(var(--mouse-y, 50) * 1%), rgba(245, 158, 11, 0.08), transparent 80%)`,
        }}
      />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-grid opacity-[0.15]" />
      
      {/* Noise texture overlay for premium feel */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />
    </div>
  );
}
