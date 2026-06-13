import React from "react";

interface ScrollingMarqueeProps {
  skills?: string;
}

export default function ScrollingMarquee({ skills }: ScrollingMarqueeProps) {
  // Parse comma-separated skills from settings, fallback to defaults if empty
  const items = skills
    ? skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [
        "FULL STACK",
        "SYSTEM DESIGN",
        "DEVOPS",
        "C++",
        "OPEN SOURCE",
        "VIBE CODER",
        "NEXT.JS",
        "NESTJS",
        "POSTGRESQL",
        "REDIS",
        "KAFKA",
      ];

  // Render the list of items separated by amber dots
  const marqueeContent = (
    <div className="flex items-center gap-6 pr-6">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <span className="text-amber font-sans">●</span>
          <span>{item.toUpperCase()}</span>
        </React.Fragment>
      ))}
      <span className="text-amber font-sans">●</span>
    </div>
  );

  return (
    <div className="w-full bg-bg-surface border-t border-b border-border py-3.5 overflow-hidden select-none">
      <div className="animate-marquee-scroll flex text-[12px] font-semibold tracking-[0.15em] text-text-muted font-inter">
        {marqueeContent}
        {marqueeContent}
      </div>
    </div>
  );
}
