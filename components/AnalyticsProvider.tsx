"use client";

/**
 * @file components/AnalyticsProvider.tsx
 * @description React component for AnalyticsProvider.tsx under the AnalyticsProvider.tsx category.
 * 
 * @exports
 * - AnalyticsProvider (default): Main React component or function
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, trackPageView, trackDuration } from "@/lib/analytics";

export default function AnalyticsProvider() {
  const pathname = usePathname();
  
  // Track current path, start time and initialization ref
  const currentPathRef = useRef(pathname);
  const startTimeRef = useRef(Date.now());
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      initAnalytics().then(() => {
        // Track the first pageview on initial mount
        trackPageView(pathname);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // When the path changes, track the old path's duration and the new path's pageview
    if (pathname !== currentPathRef.current) {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (duration > 0) {
        trackDuration(currentPathRef.current, duration);
      }

      trackPageView(pathname);

      currentPathRef.current = pathname;
      startTimeRef.current = Date.now();
    }
  }, [pathname]);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      // Traverse up to find anchor element
      while (target && target.tagName !== "A") {
        target = target.parentElement;
      }

      if (!target || !(target instanceof HTMLAnchorElement)) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore anchor hashes, mailto, tel, javascript, etc.
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      try {
        const urlObj = new URL(href, window.location.origin);
        
        // Exclude admin, api, _next paths (even if they are on same origin)
        const path = urlObj.pathname;
        if (
          path.startsWith("/admin") ||
          path.startsWith("/api") ||
          path.startsWith("/_next")
        ) {
          return;
        }

        const searchParams = urlObj.searchParams;

        // Current page simplified path for campaign
        const currentPath = window.location.pathname;
        const campaign = currentPath === "/" ? "home" : currentPath.replace(/^\/|\/$/g, "").replace(/\//g, "-");

        // Determine medium (button vs standard link)
        const isButton =
          target.classList.contains("button") ||
          target.classList.contains("btn") ||
          Array.from(target.classList).some(c => c.startsWith("bg-")) ||
          target.getAttribute("role") === "button";
        const medium = isButton ? "button" : "link";

        // Extract project or blog name/slug
        const directProjMatch = path.match(/^\/projects\/([a-zA-Z0-9_-]+)/);
        const directBlogMatch = path.match(/^\/blog\/([a-zA-Z0-9_-]+)/);
        
        let projectSlug: string | null = (directProjMatch && directProjMatch[1]) ? directProjMatch[1] : null;
        let blogSlug: string | null = (directBlogMatch && directBlogMatch[1]) ? directBlogMatch[1] : null;

        // If not directly a project/blog link, search parent card container
        if (!projectSlug && !blogSlug) {
          const card = target.closest('.bg-bg-surface, .bg-bg-elevated, article, card, [class*="card"], [class*="PostCard"], [class*="ProjectCard"]');
          if (card) {
            const internalLink = card.querySelector('a[href*="/projects/"], a[href*="/blog/"]');
            if (internalLink) {
              const internalHref = internalLink.getAttribute("href") || "";
              const projMatch = internalHref.match(/\/projects\/([a-zA-Z0-9_-]+)/);
              if (projMatch && projMatch[1]) projectSlug = projMatch[1];
              const blogMatch = internalHref.match(/\/blog\/([a-zA-Z0-9_-]+)/);
              if (blogMatch && blogMatch[1]) blogSlug = blogMatch[1];
            }
          }
        }

        // Slugify link text for content
        const textContent = (target.textContent || "").trim();
        const baseContent = textContent
          ? textContent
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")
              .substring(0, 40)
          : "anchor";

        // Determine the final utm_content to include project/blog name
        let finalContent = baseContent;
        if (projectSlug) {
          finalContent = baseContent && baseContent !== projectSlug
            ? `project-${projectSlug}-${baseContent}`
            : `project-${projectSlug}`;
        } else if (blogSlug) {
          finalContent = baseContent && baseContent !== blogSlug
            ? `blog-${blogSlug}-${baseContent}`
            : `blog-${blogSlug}`;
        }

        // Only set UTM params if they are not already manually specified
        if (!searchParams.has("utm_source")) {
          searchParams.set("utm_source", "portfolio");
        }
        if (!searchParams.has("utm_medium")) {
          searchParams.set("utm_medium", medium);
        }
        if (!searchParams.has("utm_campaign")) {
          searchParams.set("utm_campaign", campaign);
        }
        if (!searchParams.has("utm_content")) {
          searchParams.set("utm_content", finalContent || "link");
        }

        // Reconstruct href with new search params
        const newHref = urlObj.origin === window.location.origin
          ? urlObj.pathname + urlObj.search + urlObj.hash
          : urlObj.toString();
        target.setAttribute("href", newHref);
      } catch {
        // Fail silently
      }
    };

    document.addEventListener("click", handleLinkClick, true);
    return () => {
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, []);

  useEffect(() => {
    const sendDuration = () => {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (duration > 0) {
        trackDuration(currentPathRef.current, duration);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendDuration();
      } else if (document.visibilityState === "visible") {
        startTimeRef.current = Date.now();
      }
    };

    const handleBeforeUnload = () => {
      sendDuration();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pathname]);

  return null;
}
