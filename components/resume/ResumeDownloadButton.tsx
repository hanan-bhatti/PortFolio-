"use client";

import { useState, useEffect } from "react";

export default function ResumeDownloadButton() {
  const [count, setCount] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/resume/download-count");
        if (res.ok) {
          const data = await res.json();
          setCount(data.count);
        }
      } catch (err) {
        console.error("Failed to fetch download count", err);
      }
    }
    fetchCount();
  }, []);

  useEffect(() => {
    const handleSuccess = () => {
      setDownloading(false);
      if (count !== null) {
        setCount(count + 1);
      }
    };
    const handleError = () => {
      setDownloading(false);
    };

    window.addEventListener("resume-download-success", handleSuccess);
    window.addEventListener("resume-download-error", handleError);

    return () => {
      window.removeEventListener("resume-download-success", handleSuccess);
      window.removeEventListener("resume-download-error", handleError);
    };
  }, [count]);

  const handleDownload = () => {
    setDownloading(true);
    window.dispatchEvent(new CustomEvent("trigger-resume-download"));
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      {count !== null && count > 0 && (
        <span
          className="hidden sm:inline"
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            fontFamily: "Inter, sans-serif",
            letterSpacing: "0.05em",
          }}
        >
          {count} download{count !== 1 ? "s" : ""}
        </span>
      )}

      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{
          background: "var(--amber)",
          color: "#000",
          border: "none",
          borderRadius: 0, // sharp corners
          padding: "6px 16px",
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          fontSize: "12px",
          letterSpacing: "0.1em",
          cursor: downloading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          opacity: downloading ? 0.7 : 1,
          transition: "opacity 0.15s ease",
        }}
      >
        {downloading ? "GENERATING..." : "↓ DOWNLOAD PDF"}
      </button>
    </div>
  );
}
