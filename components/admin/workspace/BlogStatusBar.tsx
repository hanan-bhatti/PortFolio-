"use client";

import { cn } from "@/lib/utils";

interface BlogStatusBarProps {
  currentStatus: string; // "Draft" | "Outlined" | "Written" | "Published"
  onChange: (status: string) => void;
  className?: string;
}

const STEPS = ["Draft", "Outlined", "Written", "Published"];

export default function BlogStatusBar({ currentStatus, onChange, className }: BlogStatusBarProps) {
  const activeIndex = STEPS.indexOf(currentStatus || "Draft");

  return (
    <div className={cn("border border-[#262626] bg-[#0c0c0c] p-3 flex items-center justify-between font-mono text-[10px] uppercase select-none rounded-none", className)}>
      <span className="text-zinc-500 font-bold tracking-widest">Blog workflow status:</span>
      <div className="flex items-center gap-1">
        {STEPS.map((step, idx) => {
          const isActive = activeIndex === idx;
          const isPassed = activeIndex > idx;

          return (
            <div key={step} className="flex items-center">
              <button
                type="button"
                onClick={() => onChange(step)}
                className={cn(
                  "px-2.5 py-1 border transition-all font-bold tracking-wider rounded-none outline-none",
                  isActive
                    ? "border-amber bg-amber/5 text-amber"
                    : isPassed
                    ? "border-[#10B981] bg-[#10B981]/5 text-[#10B981]"
                    : "border-[#262626] text-zinc-650 hover:border-zinc-500"
                )}
              >
                {step}
              </button>
              {idx < STEPS.length - 1 && (
                <span className="text-zinc-650 px-1 font-bold">→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
