"use client";

/**
 * @file components/ui/GithubActivity.tsx
 * @description React component for GithubActivity.tsx under the ui category.
 * 
 * @exports
 * - GithubActivity (default): Main React component or function
 */

import React, { useState, useRef } from "react";
import Contributions from "./Contributions";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface GithubActivityProps {
  socialGithub: string;
  statsCommits: string;
  socialGithubLink?: string;
}

interface GithubCardProps {
  src: string;
  alt: string;
}

function GithubCard({ src, alt }: GithubCardProps) {
  const [hasError, setHasError] = useState(false);
  const [key, setKey] = useState(0);

  const handleRetry = () => {
    setHasError(false);
    setKey((prev) => prev + 1);
  };

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        minHeight: "170px"
      }}
      className="bg-[#0a0a0a] overflow-hidden w-full flex items-center justify-center relative shadow-lg"
    >
      {hasError ? (
        <div className="flex flex-col items-center justify-center p-6 text-center gap-3 font-mono">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Failed to load statistics card</span>
          <button
            type="button"
            onClick={handleRetry}
            className="px-3 py-1.5 text-[9px] bg-transparent border border-[#262626] text-amber hover:bg-amber hover:text-black transition-all cursor-pointer font-bold uppercase tracking-widest"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={key}
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-auto object-contain block select-none pointer-events-auto animate-fadeIn"
        />
      )}
    </div>
  );
}

export default function GithubActivity({ socialGithub, statsCommits, socialGithubLink }: GithubActivityProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract username from socialGithub URL (e.g. "https://github.com/Hanan-Bhatti" -> "Hanan-Bhatti")
  // If the setting is empty, fallback to the default "Hanan-Bhatti"
  const githubUsername = socialGithub
    ? socialGithub.replace(/\/$/, "").split("/").pop() || "Hanan-Bhatti"
    : "Hanan-Bhatti";

  const githubUrl = socialGithubLink || socialGithub || `https://github.com/${githubUsername}`;

  const card1Url = `https://github-readme-stats.hanan-bhatti.site/api?username=${githubUsername}&show_icons=true&theme=dark&hide_border=true&bg_color=0a0a0a&title_color=F59E0B&icon_color=16A34A&text_color=6B7280&ring_color=F59E0B&include_all_commits=true&count_private=true`;
  const card2Url = `https://github-readme-stats.hanan-bhatti.site/api/top-langs/?username=${githubUsername}&layout=compact&theme=dark&hide_border=true&bg_color=0a0a0a&title_color=F59E0B&text_color=6B7280&langs_count=8`;
  const cardStreakUrl = `https://streak-stats.demolab.com?user=${githubUsername}&theme=dark&hide_border=true&background=0a0a0a&ring=F59E0B&fire=F59E0B&currStreakLabel=F59E0B&sideLabels=6B7280&dates=6B7280`;

  useGSAP(() => {
    const rows = gsap.utils.toArray<HTMLElement>('.stack-row', containerRef.current);
    
    rows.forEach((row, i) => {
      if (i === rows.length - 1) return; // don't fade/scale the last one

      gsap.to(row, {
        scale: 0.9,
        opacity: 0.5,
        transformOrigin: "top center",
        scrollTrigger: {
          trigger: row,
          start: `top ${100 + i * 20}px`,
          endTrigger: rows[i + 1],
          end: `top ${120 + i * 20}px`,
          scrub: true,
        }
      });
    });
  }, { scope: containerRef });

  return (
    <section className="bg-bg py-24 px-4 md:px-[8vw]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-1 pb-4 border-b border-border">
          <h2 className="font-syne font-bold text-[11px] tracking-[0.2em] text-text-muted uppercase">
            GITHUB ACTIVITY
          </h2>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-inter font-medium text-[13px] text-amber hover:underline w-fit"
          >
            @{githubUsername}
          </a>
        </div>

        {/* Dashboard Grid */}
        <div ref={containerRef} className="flex flex-col relative pb-32 gap-12">
          {/* ROW 1 */}
          <div className="stack-row sticky top-[100px] z-10 w-full grid grid-cols-1 md:grid-cols-2 gap-4 bg-bg pt-4">
            <GithubCard src={card1Url} alt="GitHub Stats Card" />
            <GithubCard src={card2Url} alt="Top Languages Card" />
          </div>

          {/* ROW 2 */}
          <div className="stack-row sticky top-[120px] z-20 w-full bg-bg pt-4">
            <div 
              style={{ border: "1px solid var(--border, #262626)" }}
              className="bg-[#0a0a0a] overflow-hidden shadow-2xl rounded-lg"
            >
              <Contributions />
            </div>
          </div>

          {/* ROW 3 */}
          <div className="stack-row sticky top-[140px] z-30 w-full bg-bg pt-4 grid grid-cols-1 gap-4">
            <GithubCard src={cardStreakUrl} alt="Streak Stats" />
          </div>
        </div>
      </div>
    </section>
  );
}
