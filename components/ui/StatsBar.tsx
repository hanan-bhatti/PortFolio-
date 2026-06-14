"use client";

/**
 * @file components/ui/StatsBar.tsx
 * @description React component for StatsBar.tsx under the ui category.
 * 
 * @exports
 * - StatsBar (default): Main React component or function
 */

import React, { useEffect, useState } from "react";

interface StatsBarProps {
  years: string;
  projects: string;
  contributions: string;
  commits: string;
}

interface GithubStats {
  totalContributions: number;
  totalCommits: number;
  totalRepos: number;
}

export default function StatsBar({ years, projects, contributions, commits }: StatsBarProps) {
  const [liveStats, setLiveStats] = useState<GithubStats | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetch("/api/github-stats")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch GitHub stats");
        return res.json();
      })
      .then((data: GithubStats) => {
        if (data && typeof data.totalContributions === "number" && typeof data.totalCommits === "number") {
          setLiveStats(data);
          setIsLive(true);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch live GitHub stats, falling back to CMS settings.", err);
      });
  }, []);

  const displayContributions = isLive && liveStats
    ? liveStats.totalContributions.toLocaleString()
    : contributions;

  const displayCommits = isLive && liveStats
    ? liveStats.totalCommits.toLocaleString()
    : commits;

  const stats = [
    { value: years, label: "Years Experience" },
    { value: projects, label: "Projects Built" },
    { value: displayContributions, label: "Contributions" },
    { value: displayCommits, label: "GitHub Commits" },
  ];

  return (
    <section className="w-full bg-bg border-b border-border py-12 px-4 relative">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      {isLive && (
        <div
          style={{
            position: "absolute",
            top: "0.75rem",
            right: "1.5rem",
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: "10px",
            letterSpacing: "0.12em",
            color: "var(--green)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span style={{ animation: "pulse 2s infinite" }}>●</span>
          LIVE
        </div>
      )}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 items-center justify-center text-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="relative flex flex-col items-center justify-center">
              <span className="font-syne font-extrabold text-[clamp(2.5rem,5vw,3.5rem)] text-amber leading-none">
                {stat.value}
              </span>
              <span className="font-inter font-normal text-[11px] tracking-[0.15em] text-text-muted uppercase mt-2 flex items-center justify-center">
                {stat.label}
              </span>

              {/* Vertical divider on desktop, only after columns 1, 2, 3 */}
              {idx < 3 && (
                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-[40px] bg-green/30" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
