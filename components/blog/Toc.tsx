"use client";

/**
 * @file components/blog/Toc.tsx
 * @description React component for Toc.tsx under the blog category.
 * 
 * @exports
 * - Toc (default): Main React component or function
 */

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/tiptap-html";

export default function Toc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      return window.location.hash.replace("#", "");
    }
    return "";
  });

  useEffect(() => {
    if (items.length === 0) return;

    const handleScroll = () => {
      // Find the current scroll position with an offset for the sticky header
      const scrollPosition = window.scrollY + 140;

      let currentActiveId = "";

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item) continue;
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (scrollPosition >= top) {
            currentActiveId = item.id;
          } else {
            break;
          }
        }
      }

      // Fallback: If we are at the very bottom of the page, highlight the last section
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
      const lastItem = items[items.length - 1];
      if (isAtBottom && lastItem) {
        currentActiveId = lastItem.id;
      }

      // Fallback: Highlight the first item if we haven't scrolled past any section yet
      const firstItem = items[0];
      if (!currentActiveId && firstItem) {
        currentActiveId = firstItem.id;
      }

      setActiveId(currentActiveId);
    };

    // Initialize immediately
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("hashchange", handleScroll);

    // Run again after a short delay to account for layout shifts/image loads
    const timer = setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", handleScroll);
      clearTimeout(timer);
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="sticky top-28 hidden max-h-[70vh] overflow-y-auto pl-5 lg:block border-l-2 border-border">
      <p className="mb-4 font-inter font-semibold text-[11px] tracking-[0.15em] text-text-muted uppercase text-left">
        ON THIS PAGE
      </p>
      <ul className="space-y-3 text-left">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li
              key={item.id}
              style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
              className="relative"
            >
              <a
                href={`#${item.id}`}
                className={`block font-inter text-[13px] font-normal transition-all duration-150 py-0.5 ${
                  isActive
                    ? "text-amber border-l-2 border-amber ml-[-1.27rem] pl-[1.25rem]"
                    : "text-text-muted hover:text-amber hover:border-l-2 hover:border-amber hover:ml-[-1.27rem] hover:pl-[1.25rem]"
                }`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
