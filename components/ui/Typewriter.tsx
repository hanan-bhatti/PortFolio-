"use client";

/**
 * @file components/ui/Typewriter.tsx
 * @description React component for Typewriter.tsx under the ui category.
 * 
 * @exports
 * - Typewriter (default): Main React component or function
 */

import { useEffect, useState } from "react";

export default function Typewriter({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");

  useEffect(() => {
    const word = words[index % words.length] ?? "";
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (text === word) {
        timeout = setTimeout(() => setPhase("deleting"), 1600);
      } else {
        timeout = setTimeout(() => setText(word.slice(0, text.length + 1)), 80);
      }
    } else if (phase === "deleting") {
      if (text === "") {
        setIndex((i) => i + 1);
        setPhase("typing");
        timeout = setTimeout(() => undefined, 0);
      } else {
        timeout = setTimeout(() => setText(word.slice(0, text.length - 1)), 40);
      }
    } else {
      timeout = setTimeout(() => undefined, 0);
    }

    return () => clearTimeout(timeout);
  }, [text, phase, index, words]);

  return (
    <span className="gradient-text">
      {text}
      <span className="animate-pulse text-cyan-accent">|</span>
    </span>
  );
}
