"use client";

/**
 * @file components/blog/ShareButton.tsx
 * @description Client-side component for sharing posts. Copies a tracked short link to the clipboard.
 * 
 * @exports
 * - ShareButton (default): Main share button component
 */

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getVisitorId } from "@/lib/analytics";

interface Props {
  postId: string;
  shareCode: string;
}

export default function ShareButton({ postId, shareCode }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const siteUrl = window.location.origin;
    const shareUrl = `${siteUrl}/s/${shareCode}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);

      // Track share action click on client
      const vid = getVisitorId() || undefined;
      await fetch("/api/analytics/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, visitorId: vid }),
      });
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "rounded-none border border-[#262626] hover:border-amber bg-black/20 hover:bg-[#F59E0B]/5 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-amber transition-colors cursor-pointer select-none flex items-center gap-1.5"
      )}
    >
      <span>{copied ? "COPIED LINK" : "SHARE POST"}</span>
    </button>
  );
}
