"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  currentEmoji: string;
  onSelect: (emoji: string) => void;
  className?: string;
}

const EMOJIS = [
  "📄", "🚀", "✍️", "💻", "🔗", "📝", "💡", "📅", "⚙️", "🛠️",
  "🎨", "🧪", "🔑", "📦", "🔥", "⚡", "⭐", "🎯", "📌", "💼",
  "❤️", "🎉", "🔊", "🌍", "🍕", "🍔", "☕", "🍺", "📈", "📉"
];

export default function EmojiPicker({ currentEmoji, onSelect, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-2xl hover:bg-zinc-900 p-1.5 border border-transparent hover:border-[#262626] transition-all rounded-none outline-none"
        title="Select page emoji"
      >
        {currentEmoji}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 p-3 bg-[#0c0c0c] border border-[#262626] grid grid-cols-6 gap-1.5 z-50 w-[210px] animate-fadeIn rounded-none shadow-xl">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onSelect(emoji);
                  setOpen(false);
                }}
                className={cn(
                  "text-lg p-1 hover:bg-zinc-800 transition-colors rounded-none outline-none",
                  currentEmoji === emoji && "bg-amber/15 border border-amber/35"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
