"use client";

/**
 * @file components/blog/BlogContentClient.tsx
 * @description Client-side wrapper for blog content. Dynamically injects copy buttons to pre/code blocks and tracks clicks.
 * 
 * @exports
 * - BlogContentClient (default): Client side blog content container
 */

import { useEffect } from "react";
import { toast } from "sonner";
import { getVisitorId } from "@/lib/analytics";

interface Props {
  html: string;
  postId: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  sectionReactionsOn?: boolean;
  sectionSummary?: Record<string, Record<string, number>>;
  mySectionReactions?: Record<string, string[]>;
  onSectionTriggerClick?: (sectionId: string, rect: DOMRect) => void;
  onSectionReact?: (sectionId: string, emoji: string) => void;
  onCopyEvent?: (codeBlockId: string) => void;
}

export default function BlogContentClient({
  html,
  postId,
  containerRef,
  sectionReactionsOn = false,
  sectionSummary = {},
  mySectionReactions = {},
  onSectionTriggerClick,
  onSectionReact,
  onCopyEvent,
}: Props) {

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Cleanup any previously injected react elements to prevent duplicates
    container.querySelectorAll(".section-react-btn").forEach((el) => el.remove());
    container.querySelectorAll(".section-react-badges-row").forEach((el) => el.remove());
    container.querySelectorAll(".section-react-pre-container").forEach((el) => el.remove());

    // 1. Handle Multiline Code Blocks (<pre>)
    const preElements = container.querySelectorAll("pre");
    preElements.forEach((pre, idx) => {
      pre.style.position = "relative";
      pre.classList.add("group");

      if (pre.querySelector(".copy-code-btn")) return;

      const codeBlockId = `pre-block-${idx}`;
      const button = document.createElement("button");
      button.type = "button";
      button.id = `copy-btn-${codeBlockId}`;
      button.className =
        "copy-code-btn absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#0c0c0c]/80 border border-[#262626] hover:border-amber px-2 py-1 font-mono text-[10px] text-zinc-400 hover:text-amber rounded-none cursor-pointer z-10 select-none";
      button.innerText = "COPY";

      const codeElement = pre.querySelector("code");
      const codeText = codeElement ? codeElement.innerText : pre.innerText;

      button.addEventListener("click", (e) => {
        e.stopPropagation();
        navigator.clipboard
          .writeText(codeText)
          .then(() => {
            button.innerText = "COPIED";
            toast.success("Code copied to clipboard");
            setTimeout(() => {
              button.innerText = "COPY";
            }, 2000);

            trackCopy(codeText, true, codeBlockId);
            onCopyEvent?.(codeBlockId);
          })
          .catch(() => {
            toast.error("Failed to copy code");
          });
      });

      pre.appendChild(button);

      // Section Reaction for pre (code block)
      if (sectionReactionsOn) {
        // Find nearest heading above this pre
        let nearestHeading: Element | null = null;
        let prev = pre.previousElementSibling;
        while (prev) {
          if (["H2", "H3", "H4", "H5"].includes(prev.tagName) && prev.id) {
            nearestHeading = prev;
            break;
          }
          prev = prev.previousElementSibling;
        }

        const sectionId = nearestHeading?.id || `intro-${idx}`;
        const containerDiv = document.createElement("div");
        containerDiv.className =
          "section-react-pre-container absolute top-2 right-14 opacity-50 group-hover:opacity-100 transition-opacity duration-200 z-10 select-none";

        const reactBtn = document.createElement("button");
        reactBtn.type = "button";
        reactBtn.className =
          "bg-[#0c0c0c]/85 border border-[#262626] hover:border-amber px-2 py-1 font-mono text-[10px] text-zinc-400 hover:text-amber rounded-none cursor-pointer flex items-center justify-center";
        reactBtn.innerText = "REACT";
        reactBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const rect = reactBtn.getBoundingClientRect();
          onSectionTriggerClick?.(sectionId, rect);
        });

        containerDiv.appendChild(reactBtn);
        pre.appendChild(containerDiv);
      }
    });

    // 2. Handle Inline Code Blocks (<code> that do NOT have a <pre> ancestor)
    const codeElements = container.querySelectorAll("code");
    codeElements.forEach((code, idx) => {
      if (code.parentElement?.tagName === "PRE") return;

      const codeBlockId = `inline-block-${idx}`;
      code.id = `code-${codeBlockId}`;
      code.style.cursor = "pointer";
      code.title = "Click to copy";

      const onInlineClick = (e: Event) => {
        e.stopPropagation();
        const text = code.innerText;
        navigator.clipboard
          .writeText(text)
          .then(() => {
            toast.success("Code copied");
            trackCopy(text, false, codeBlockId);
            onCopyEvent?.(codeBlockId);
          })
          .catch(() => {
            toast.error("Failed to copy");
          });
      };

      code.addEventListener("click", onInlineClick);
      (code as any)._onInlineClick = onInlineClick;
    });

    // 3. Intercept clicks on shortlinks to append visitorId query param
    const shortLinks = container.querySelectorAll('a[href^="/s/"]');
    shortLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;

      const onLinkClick = (e: MouseEvent) => {
        const vid = getVisitorId();
        if (vid) {
          e.preventDefault();
          const targetUrl = href.includes("?") ? `${href}&v=${vid}` : `${href}?v=${vid}`;
          window.location.href = targetUrl;
        }
      };

      link.addEventListener("click", onLinkClick as any);
      (link as any)._onLinkClick = onLinkClick;
    });

    // 4. Section Reactions for headings (H2, H3, H4, H5 with an id)
    if (sectionReactionsOn) {
      const headings = container.querySelectorAll("h2, h3, h4, h5");
      headings.forEach((el) => {
        const heading = el as HTMLElement;
        const sectionId = heading.id;
        if (!sectionId) return;

        heading.style.position = "relative";
        heading.classList.add("group/heading");

        // Create trigger button
        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className =
          "section-react-btn inline-flex items-center ml-3 opacity-40 group-hover/heading:opacity-100 focus:opacity-100 transition-opacity bg-transparent text-zinc-400 hover:text-amber p-1 text-[11px] rounded-none cursor-pointer select-none align-middle z-10";
        trigger.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
        trigger.title = "React to this section";
        trigger.addEventListener("click", (e) => {
          e.stopPropagation();
          const rect = trigger.getBoundingClientRect();
          onSectionTriggerClick?.(sectionId, rect);
        });

        heading.appendChild(trigger);

        // Render badges row under heading if reactions exist
        const sectionReacts = sectionSummary[sectionId];
        if (sectionReacts && Object.keys(sectionReacts).length > 0) {
          const badgesContainer = document.createElement("div");
          badgesContainer.className =
            "section-react-badges-row flex flex-wrap gap-1 mt-2.5 font-mono text-[10px] w-full font-normal";

          Object.entries(sectionReacts).forEach(([emoji, count]) => {
            if (count <= 0) return;
            const isMyReact = mySectionReactions[sectionId]?.includes(emoji);
            const badge = document.createElement("button");
            badge.type = "button";
            badge.className = `inline-flex items-center gap-1.5 px-2 py-0.5 border ${
              isMyReact
                ? "border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A]"
                : "border-[#262626] bg-[#0c0c0c]/40 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
            } rounded-none cursor-pointer transition-colors`;
            badge.innerHTML = `<span>${emoji}</span><span>${count}</span>`;
            badge.addEventListener("click", (e) => {
              e.stopPropagation();
              onSectionReact?.(sectionId, emoji);
            });
            badgesContainer.appendChild(badge);
          });

          heading.appendChild(badgesContainer);
        }
      });
    }

    async function trackCopy(codeText: string, isMultiline: boolean, codeBlockId: string) {
      try {
        const visitorId = getVisitorId() || undefined;

        await fetch("/api/analytics/copy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postId,
            codeBlockId,
            codeBlock: codeText.slice(0, 1000),
            isMultiline,
            visitorId,
          }),
        });
      } catch (err) {
        // fail silently
      }
    }

    return () => {
      // Cleanup event listeners
      const codes = container.querySelectorAll("code");
      codes.forEach((code) => {
        if ((code as any)._onInlineClick) {
          code.removeEventListener("click", (code as any)._onInlineClick);
        }
      });

      const links = container.querySelectorAll('a[href^="/s/"]');
      links.forEach((link) => {
        if ((link as any)._onLinkClick) {
          link.removeEventListener("click", (link as any)._onLinkClick);
        }
      });
    };
  }, [
    html,
    postId,
    containerRef,
    sectionReactionsOn,
    sectionSummary,
    mySectionReactions,
    onCopyEvent,
    onSectionReact,
    onSectionTriggerClick,
  ]);

  return (
    <div
      ref={containerRef}
      className="prose-blog w-full max-w-full lg:max-w-3xl min-w-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
