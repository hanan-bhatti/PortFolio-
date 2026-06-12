"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ThreeErrorBoundary } from "./ThreeErrorBoundary";

const BlobBackground = dynamic(() => import("./BlobBackground"), { ssr: false });

function CssBlobFallback() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="css-blob absolute -top-20 -left-20 h-96 w-96 bg-indigo-accent/30" />
      <div
        className="css-blob absolute right-0 bottom-0 h-[28rem] w-[28rem] bg-cyan-accent/20"
        style={{ animationDelay: "-6s" }}
      />
    </div>
  );
}

export default function LazyBackground() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent): void => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (isMobile === null || isMobile) return <CssBlobFallback />;

  return (
    <ThreeErrorBoundary fallback={<CssBlobFallback />}>
      <BlobBackground />
    </ThreeErrorBoundary>
  );
}
