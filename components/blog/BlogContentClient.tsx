"use client";

/**
 * @file components/blog/BlogContentClient.tsx
 * @description Client-side wrapper for blog content. Dynamically injects copy buttons to pre/code blocks and tracks clicks.
 * 
 * @exports
 * - BlogContentClient (default): Client side blog content container
 */

import { useEffect, useState, useMemo } from "react";
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
  widgets?: Record<string, React.ReactNode>;
  githubRepos?: Record<string, any>;
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
  widgets = {},
  githubRepos = {},
}: Props) {
  const [localGithubRepos, setLocalGithubRepos] = useState<Record<string, any>>({});

  const parts = useMemo(() => {
    // Splits by capturing the full elements of both data-widget and data-github-embed
    return html.split(/(<div\s+[^>]*\bdata-widget="[^"]+"[^>]*>[\s\S]*?<\/div>|<div\s+[^>]*\bdata-github-embed="[^"]+"[^>]*>[\s\S]*?<\/div>)/gi);
  }, [html]);

  // Client-side fetch for github repo details (especially for admin editor preview)
  useEffect(() => {
    const repoPaths: string[] = [];
    parts.forEach((part, idx) => {
      if (idx % 2 === 1 && part.includes("data-github-embed=")) {
        const match = part.match(/data-github-embed="([^"]+)"/i);
        if (match && match[1]) {
          repoPaths.push(match[1]);
        }
      }
    });

    repoPaths.forEach((repoPath) => {
      if (githubRepos[repoPath] || localGithubRepos[repoPath]) return;

      fetch(`https://api.github.com/repos/${repoPath}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        })
        .then((data) => {
          setLocalGithubRepos((prev) => ({
            ...prev,
            [repoPath]: {
              name: data.name,
              owner: data.owner.login,
              description: data.description || "No description provided.",
              stars: data.stargazers_count,
              forks: data.forks_count,
              language: data.language || null,
              url: data.html_url,
            },
          }));
        })
        .catch(() => {
          // Fail silently, fallback to hyperlink
        });
    });
  }, [parts, githubRepos, localGithubRepos]);

  const renderGithubCard = (repoPath: string) => {
    const repo = githubRepos[repoPath] || localGithubRepos[repoPath];
    if (!repo) {
      return (
        <a
          href={`https://github.com/${repoPath}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-amber hover:underline hover:text-amber/90"
        >
          github.com/{repoPath}
        </a>
      );
    }
    return (
      <div className="border border-[#262626] bg-[#0c0c0c]/40 p-4 rounded-none font-mono text-zinc-300 my-6">
        <div className="flex justify-between items-start mb-2">
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-amber hover:underline text-xs md:text-sm"
          >
            {repo.owner}/{repo.name}
          </a>
          <span className="text-[9px] text-zinc-550 border border-[#262626] px-1.5 py-0.5 select-none">
            GITHUB
          </span>
        </div>
        <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{repo.description}</p>
        <div className="flex flex-wrap gap-4 text-[10px] text-zinc-500">
          {repo.language && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green rounded-none inline-block border border-green-dim" />
              {repo.language}
            </span>
          )}
          <span>★ {repo.stars} stars</span>
          <span>⑂ {repo.forks} forks</span>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Cleanup any previously injected react elements, event listeners, and wrappers
    container.querySelectorAll(".copy-code-btn").forEach((el) => el.remove());
    container.querySelectorAll(".section-react-btn").forEach((el) => el.remove());
    container.querySelectorAll(".section-react-badges-row").forEach((el) => el.remove());
    container.querySelectorAll(".section-react-pre-container").forEach((el) => el.remove());

    container.querySelectorAll(".code-block-collapse-wrapper").forEach((wrapper) => {
      const pre = wrapper.querySelector("pre");
      if (pre) {
        pre.style.paddingBottom = "";
        wrapper.parentNode?.insertBefore(pre, wrapper);
      }
      wrapper.remove();
    });

    // 1. Handle Mermaid Client-side rendering fallback
    (async () => {
      const pendingMermaids = container.querySelectorAll('[data-mermaid-pending="true"]');
      if (pendingMermaids.length > 0) {
        try {
          const { default: mermaid } = await import("mermaid");
          mermaid.initialize({
            startOnLoad: false,
            theme: "dark",
            securityLevel: "loose",
          });

          for (let i = 0; i < pendingMermaids.length; i++) {
            const codeEl = pendingMermaids[i] as HTMLElement;
            const preEl = codeEl.parentElement;
            if (!preEl) continue;

            const code = codeEl.textContent || "";
            const id = `mermaid-render-${Date.now()}-${i}`;

            try {
              const { svg } = await mermaid.render(id, code);

              const containerDiv = document.createElement("div");
              containerDiv.className = "mermaid-svg-container select-none my-6 text-center";
              containerDiv.setAttribute("data-mermaid-code", encodeURIComponent(code));
              containerDiv.innerHTML = svg;
              preEl.replaceWith(containerDiv);

              // POST back to cache
              fetch("/api/posts/mermaid/cache", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, svg }),
              }).catch((e) => console.error("Failed to POST mermaid SVG to cache", e));
            } catch (err) {
              console.error("Failed to render mermaid diagram client side", err);
            }
          }
        } catch (err) {
          console.error("Failed to import/initialize mermaid", err);
        }
      }
    })();

    // 2. Handle Multiline Code Blocks (<pre>)
    const preElements = container.querySelectorAll("pre");
    preElements.forEach((pre, idx) => {
      // Skip wrapping if it is a language-mermaid or has data-mermaid-pending
      const codeElement = pre.querySelector("code");
      if (codeElement && (codeElement.getAttribute("data-mermaid-pending") === "true" || codeElement.classList.contains("language-mermaid"))) {
        return;
      }
      if (pre.classList.contains("language-mermaid")) {
        return;
      }

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

      // Check lines count for collapsing
      const lines = codeText.trim().split("\n").length;
      if (lines > 15) {
        const wrapper = document.createElement("div");
        wrapper.className = "code-block-collapse-wrapper relative overflow-hidden transition-all duration-300 w-full mb-6";
        wrapper.style.maxHeight = "320px";

        pre.parentNode?.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const overlay = document.createElement("div");
        overlay.className = "code-block-overlay absolute bottom-0 left-0 right-0 h-16 pointer-events-none transition-opacity duration-300 bg-gradient-to-t from-[#22241d] to-transparent z-20";
        wrapper.appendChild(overlay);

        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] font-bold uppercase tracking-widest text-amber border border-amber bg-[#22241d] px-3 py-1.5 hover:bg-amber hover:text-[#22241d] transition-all duration-200 cursor-pointer rounded-none z-30 select-none shadow-md";
        toggleBtn.innerText = "SHOW MORE";

        let isExpanded = false;
        toggleBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          isExpanded = !isExpanded;
          if (isExpanded) {
            wrapper.style.maxHeight = `${pre.scrollHeight + 48}px`;
            pre.style.paddingBottom = "3rem";
            toggleBtn.innerText = "SHOW LESS";
            overlay.style.opacity = "0";

            setTimeout(() => {
              if (isExpanded) {
                wrapper.style.maxHeight = "none";
              }
            }, 300);
          } else {
            pre.style.paddingBottom = "";
            wrapper.style.maxHeight = "320px";
            toggleBtn.innerText = "SHOW MORE";
            overlay.style.opacity = "1";
          }
        });

        wrapper.appendChild(toggleBtn);
      }
    });

    // 3. Handle Inline Code Blocks (<code> that do NOT have a <pre> ancestor)
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

    // 4. Intercept clicks on shortlinks to append visitorId query param
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

    // 5. Section Reactions for headings (H2, H3, H4, H5 with an id)
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
                : "border-[#262626] bg-[#0c0c0c]/40 text-zinc-400 hover:border-zinc-550 hover:text-zinc-300"
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

      // Unwrap collapse wrappers
      container.querySelectorAll(".code-block-collapse-wrapper").forEach((wrapper) => {
        const pre = wrapper.querySelector("pre");
        if (pre) {
          pre.style.paddingBottom = "";
          wrapper.parentNode?.insertBefore(pre, wrapper);
        }
        wrapper.remove();
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
    >
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          if (!part.trim()) return null;
          return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />;
        } else {
          if (part.includes("data-widget=")) {
            const match = part.match(/data-widget="([^"]+)"/i);
            const widgetKey = (match && match[1]) ? match[1] : "";
            if (widgetKey && widgets && widgets[widgetKey]) {
              return <div key={index} className="my-6">{widgets[widgetKey]}</div>;
            }
            const widgetName = widgetKey.replace("-", " ").toUpperCase();
            return (
              <div
                key={index}
                className="border border-dashed border-[#262626] bg-[#0c0c0c]/40 p-4 text-center my-4 font-mono text-[11px] text-zinc-550 select-none"
              >
                [ENGAGEMENT WIDGET: {widgetName}]
              </div>
            );
          } else if (part.includes("data-github-embed=")) {
            const match = part.match(/data-github-embed="([^"]+)"/i);
            const repoPath = (match && match[1]) ? match[1] : "";
            if (repoPath) {
              return <div key={index} className="my-6">{renderGithubCard(repoPath)}</div>;
            }
          }
          return null;
        }
      })}
    </div>
  );
}
