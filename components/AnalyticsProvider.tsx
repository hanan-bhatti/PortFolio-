"use client";

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
