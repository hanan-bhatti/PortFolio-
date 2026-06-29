"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  url: string;
  domain?: string;
}

interface LinkPreviewCardProps {
  data?: LinkPreviewData;
  loading?: boolean;
  error?: string;
  className?: string;
}

export default function LinkPreviewCard({ data, loading, error, className }: LinkPreviewCardProps) {
  if (loading) {
    return (
      <div className={cn("border border-[#262626] bg-[#0c0c0c] p-3 animate-pulse flex items-center justify-between gap-4 h-[90px] rounded-none", className)}>
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-zinc-800 w-1/3 rounded-none" />
          <div className="h-4 bg-zinc-800 w-3/4 rounded-none" />
          <div className="h-3 bg-zinc-800 w-1/2 rounded-none" />
        </div>
        <div className="w-[100px] h-[60px] bg-zinc-800 shrink-0 rounded-none" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <a
        href={data?.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("block border border-[#262626] hover:border-amber bg-black/40 p-3 font-mono text-xs text-zinc-400 truncate hover:text-amber transition-colors rounded-none", className)}
      >
        🔗 {data?.url || "External Link"}
      </a>
    );
  }

  const faviconUrl = data.favicon || "/favicon.ico";

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex border border-[#262626] bg-[#0c0c0c] hover:border-amber/80 transition-all select-none p-3.5 items-center justify-between gap-4 text-left group rounded-none min-h-[95px] max-w-[650px] relative overflow-hidden",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-white group-hover:text-amber transition-colors truncate font-mono">
          {data.title || "Link Preview"}
        </h4>
        <p className="text-[10px] text-zinc-450 line-clamp-2 mt-1 leading-relaxed">
          {data.description || "No preview summary is available for this website link."}
        </p>
        <div className="flex items-center gap-1.5 mt-2 text-[9px] font-mono text-zinc-550 uppercase tracking-wider">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={faviconUrl} alt="" className="w-3.5 h-3.5 shrink-0 object-contain rounded-none" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <span>{data.domain || "external"}</span>
        </div>
      </div>

      {data.image ? (
        <div className="w-[110px] h-[70px] relative overflow-hidden border border-[#262626] bg-zinc-950 shrink-0 rounded-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
          />
        </div>
      ) : (
        <div className="w-[110px] h-[70px] bg-black/45 border border-[#262626] flex items-center justify-center shrink-0 rounded-none">
          <span className="text-xs text-zinc-700">🌐</span>
        </div>
      )}
    </a>
  );
}
