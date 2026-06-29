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

  // Load saved canvas and library on mount
  useEffect(() => {
    try {
      const savedCanvas = localStorage.getItem("excalidraw_canvas_data");
      const savedLibrary = localStorage.getItem("excalidraw_library_items");
      
      let parsedCanvas = savedCanvas ? JSON.parse(savedCanvas) : {};
      let parsedLibrary = savedLibrary ? JSON.parse(savedLibrary) : [];

      setInitialData({
        elements: parsedCanvas.elements || [],
        appState: parsedCanvas.appState || {},
        libraryItems: parsedLibrary
      });
    } catch (e) {
      console.error("Failed to load excalidraw cache:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced auto-save elements and appState to localStorage
  const handleCanvasChange = (elements: readonly any[], appState: any) => {
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
    }, 1000);
  };

  // Persist imported/updated shape library items
  const handleLibraryChange = (items: readonly any[]) => {
    try {
      localStorage.setItem("excalidraw_library_items", JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save excalidraw library items:", e);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen w-auto -m-4 sm:-m-6 md:-m-8 border-none bg-[#0c0c0c] overflow-hidden relative">
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
            onLibraryChange={handleLibraryChange}
          />
        )}
      </div>
      <div className="border-t border-[#262626] px-6 py-2.5 bg-[#0c0c0c] flex items-center justify-between select-none font-mono text-[9px] text-zinc-500">
        <span>Integrated open-source Excalidraw library</span>
        <a 
          href="https://github.com/excalidraw/excalidraw" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-amber hover:text-amber/80 transition-colors uppercase tracking-widest"
        >
          GitHub Repo →
        </a>
      </div>
    </div>
  );
}
