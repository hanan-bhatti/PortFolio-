"use client";

/**
 * @file components/blog/BlogContentClient.tsx
 * @description Client-side wrapper for blog content. Dynamically injects copy buttons to pre/code blocks and tracks clicks.
 * 
 * @exports
 * - BlogContentClient (default): Client side blog content container
 */

import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface Props {
  html: string;
  postId: string;
}

export default function BlogContentClient({ html, postId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Handle Multiline Code Blocks (<pre>)
    const preElements = container.querySelectorAll("pre");
    preElements.forEach((pre) => {
      pre.style.position = "relative";
      pre.classList.add("group");

      if (pre.querySelector(".copy-code-btn")) return;

      const button = document.createElement("button");
      button.type = "button";
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

            trackCopy(codeText, true);
          })
          .catch(() => {
            toast.error("Failed to copy code");
          });
      });

      pre.appendChild(button);
    });

    // 2. Handle Inline Code Blocks (<code> that do NOT have a <pre> ancestor)
    const codeElements = container.querySelectorAll("code");
    codeElements.forEach((code) => {
      if (code.parentElement?.tagName === "PRE") return;

      code.style.cursor = "pointer";
      code.title = "Click to copy";

      const onInlineClick = (e: Event) => {
        e.stopPropagation();
        const text = code.innerText;
        navigator.clipboard
          .writeText(text)
          .then(() => {
            toast.success("Code copied");
            trackCopy(text, false);
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
        const vid = localStorage.getItem("visitorId");
        if (vid) {
          e.preventDefault();
          const targetUrl = href.includes("?") ? `${href}&v=${vid}` : `${href}?v=${vid}`;
          window.location.href = targetUrl;
        }
      };

      link.addEventListener("click", onLinkClick as any);
      (link as any)._onLinkClick = onLinkClick;
    });

    async function trackCopy(codeText: string, isMultiline: boolean) {
      try {
        const visitorId = localStorage.getItem("visitorId") || undefined;

        await fetch("/api/analytics/copy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postId,
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
  }, [html, postId]);

  return (
    <div
      ref={containerRef}
      className="prose-blog w-full max-w-full lg:max-w-3xl min-w-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
