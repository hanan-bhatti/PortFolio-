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
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible entries
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by their bounding client rect to find the one closest to the top of the viewport
          const topVisible = visibleEntries.reduce((prev, curr) => {
            return curr.boundingClientRect.top < prev.boundingClientRect.top ? curr : prev;
          });
          setActiveId(topVisible.target.id);
        }
      },
      {
        rootMargin: "-100px 0px -70% 0px",
        threshold: 0.1,
      }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => {
      items.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el) observer.unobserve(el);
      });
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
