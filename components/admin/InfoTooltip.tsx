import React from "react";

interface InfoTooltipProps {
  content: string;
}

export default function InfoTooltip({ content }: InfoTooltipProps) {
  return (
    <span className="group relative inline-block ml-1 cursor-help shrink-0 select-none">
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400 border border-zinc-700/80 hover:bg-zinc-700 hover:text-white transition-colors">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-48 -translate-x-1/2 bg-zinc-950 border border-zinc-800 p-2 font-mono text-[10px] uppercase leading-normal text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 shadow-xl whitespace-normal break-words text-center">
        {content}
        <span className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b border-zinc-800 bg-zinc-950" />
      </span>
    </span>
  );
}
