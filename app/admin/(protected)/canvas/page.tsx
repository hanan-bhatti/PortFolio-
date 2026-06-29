"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

const ExcalidrawWrapper = dynamic(
  async () => await import("@/components/admin/ExcalidrawWrapper"),
  { ssr: false }
);

export default function CanvasPage() {
  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved canvas on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("excalidraw_canvas_data");
      if (saved) {
        setInitialData(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load excalidraw cache:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced auto-save to localStorage
  const handleCanvasChange = (elements: readonly any[], appState: any) => {
    // Excalidraw fires onChange frequently, so we filter deleted elements and debounce
    const activeElements = elements.filter((el) => !el.isDeleted);
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const cachePayload = {
          elements: activeElements,
          appState: {
            viewBackgroundColor: appState.viewBackgroundColor,
            zenModeEnabled: appState.zenModeEnabled,
            theme: appState.theme
          }
        };
        localStorage.setItem("excalidraw_canvas_data", JSON.stringify(cachePayload));
      } catch (e) {
        console.error("Failed to save excalidraw cache:", e);
      }
    }, 1000); // 1-second debounce to keep UI fast
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] w-full border border-[#262626] bg-[#0c0c0c] rounded-none overflow-hidden relative">
      <div className="border-b border-[#262626] px-6 py-4 bg-[#0c0c0c] flex items-center justify-between select-none">
        <h1 className="font-syne font-extrabold text-lg text-white uppercase tracking-tight">
          Excalidraw Canvas
        </h1>
        <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">
          Autosaved to cache
        </span>
      </div>
      <div className="flex-1 w-full bg-black relative">
        {!isLoading && (
          <ExcalidrawWrapper
            initialData={initialData}
            onChange={handleCanvasChange}
          />
        )}
      </div>
    </div>
  );
}
