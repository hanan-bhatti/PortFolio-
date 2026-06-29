"use client";

/**
 * @file components/ui/GithubActivity.tsx
 * @description React component for GithubActivity.tsx under the ui category.
 * 
 * @exports
 * - GithubActivity (default): Main React component or function
 */

import React, { useState } from "react";

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
      className="bg-[#0a0a0a] overflow-hidden w-full flex items-center justify-center relative"
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
  // Extract username from socialGithub URL (e.g. "https://github.com/Hanan-Bhatti" -> "Hanan-Bhatti")
  // If the setting is empty, fallback to the default "Hanan-Bhatti"
  const githubUsername = socialGithub
    ? socialGithub.replace(/\/$/, "").split("/").pop() || "Hanan-Bhatti"
    : "Hanan-Bhatti";

  const githubUrl = socialGithubLink || socialGithub || `https://github.com/${githubUsername}`;

  const card1Url = `https://github-readme-stats-eight.vercel.app/api?username=${githubUsername}&show_icons=true&theme=dark&hide_border=true&bg_color=0a0a0a&title_color=F59E0B&icon_color=16A34A&text_color=6B7280&ring_color=F59E0B&include_all_commits=true&count_private=true`;
  const card2Url = `https://github-readme-stats-eight.vercel.app/api/top-langs/?username=${githubUsername}&layout=compact&theme=dark&hide_border=true&bg_color=0a0a0a&title_color=F59E0B&text_color=6B7280&langs_count=8`;
  const cardStreakUrl = `https://streak-stats.demolab.com?user=${githubUsername}&theme=dark&hide_border=true&background=0a0a0a&ring=F59E0B&fire=F59E0B&currStreakLabel=F59E0B&sideLabels=6B7280&dates=6B7280`;

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
        <div className="flex flex-col gap-4">
          {/* ROW 1 — side by side 50/50 grid, gap: 1rem (gap-4) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GithubCard src={card1Url} alt="GitHub Stats Card" />
            <GithubCard src={card2Url} alt="Top Languages Card" />
          </div>

          {/* ROW 2 — Jandi contribution heatmap */}
          <div 
            style={{
              border: "1px solid var(--border)",
              width: "100%",
            }}
            className="bg-[#0a0a0a] overflow-hidden"
          >
            <iframe
              src={`https://jandi.firejune.io/${githubUsername}?scheme=dark&radius=0&margin=2&footer=false&tz=Asia/Karachi`}
              frameBorder="0"
              scrolling="no"
              style={{
                width: "100%",
                height: "170px",
                border: "none",
                display: "block",
                filter: "hue-rotate(65deg) saturate(1.8) brightness(0.9)",
              }}
              title="GitHub Contributions"
            />
          </div>

          {/* ROW 3 — Streak Stats */}
          <div className="grid grid-cols-1 gap-4">
            <GithubCard src={cardStreakUrl} alt="Streak Stats" />
          </div>
        </div>
      </div>
    </section>
  );
}
