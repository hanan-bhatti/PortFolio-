"use client";

import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";

const CHARS = "!<>-_\\\\/[]{}—=+*^?#________";

export default function EncryptedText({ text, className = "" }: { text: string; className?: string }) {
  const [displayText, setDisplayText] = useState("");
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText((prev) =>
        text
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3;
    }, 30);

    return () => clearInterval(interval);
  }, [text, isInView]);

  return (
    <span ref={ref} className={className}>
      {displayText || text.replace(/./g, "\u00A0")}
    </span>
  );
}
