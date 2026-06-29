"use client";

import { useState } from "react";
import { Excalidraw, useHandleLibrary, exportToBlob, exportToSvg } from "@excalidraw/excalidraw";
import { toast } from "sonner";

interface ExcalidrawWrapperProps {
  initialData: any;
  onChange: (elements: readonly any[], appState: any) => void;
  onLibraryChange: (items: readonly any[]) => void;
}

export default function ExcalidrawWrapper({
  initialData,
  onChange,
  onLibraryChange
}: ExcalidrawWrapperProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  // Hook to handle URL hash imports like `#addLibrary=...`
  useHandleLibrary({ excalidrawAPI });

  // Export board as a PNG image
  const exportPng = async () => {
    if (!excalidrawAPI) return;
    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();
      
      const activeElements = elements.filter((el: any) => !el.isDeleted);
      if (activeElements.length === 0) {
        toast.error("Nothing to export. Draw something first!");
        return;
      }

      const blob = await exportToBlob({
        elements: activeElements,
        appState: { ...appState, exportWithBackground: true },
        files,
        mimeType: "image/png",
        exportPadding: 20
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `excalidraw-export-${Date.now()}.png`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Downloaded board as PNG");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export PNG");
    }
  };

  // Export board as an SVG image
  const exportSvg = async () => {
    if (!excalidrawAPI) return;
    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();
      
      const activeElements = elements.filter((el: any) => !el.isDeleted);
      if (activeElements.length === 0) {
        toast.error("Nothing to export. Draw something first!");
        return;
      }

      const svgElement = await exportToSvg({
        elements: activeElements,
        appState: { ...appState, exportWithBackground: true },
        files,
        exportPadding: 20
      });

      const svgString = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `excalidraw-export-${Date.now()}.svg`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Downloaded board as SVG");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export SVG");
    }
  };

  // Export custom library items
  const exportLibrary = () => {
    try {
      const savedLibrary = localStorage.getItem("excalidraw_library_items");
      if (!savedLibrary || JSON.parse(savedLibrary).length === 0) {
        toast.error("Your shape library is empty!");
        return;
      }

      const blob = new Blob([savedLibrary], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `custom-shapes-${Date.now()}.excalidrawlib`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Exported custom library");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export library");
    }
  };

  return (
    <div className="w-full h-full relative">
      <Excalidraw
        theme="dark"
        initialData={initialData}
        onChange={onChange}
        onLibraryChange={onLibraryChange}
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
      />
      {excalidrawAPI && (
        <div className="absolute top-[72px] right-3.5 z-55 flex items-center gap-2 select-none">
          <div className="relative group">
            <button
              type="button"
              className="px-2.5 py-1.5 text-[9px] bg-[#0c0c0c]/90 border border-[#262626] text-zinc-400 hover:text-white transition-all cursor-pointer font-bold font-mono uppercase tracking-widest flex items-center gap-1.5 rounded-none shadow-xl hover:border-zinc-500"
            >
              Export Utility ↓
            </button>
            <div className="hidden group-hover:flex flex-col absolute right-0 top-full mt-1 bg-[#0c0c0c] border border-[#262626] p-1 shadow-2xl min-w-[120px] font-mono text-[9px] uppercase tracking-wider text-zinc-400">
              <button
                type="button"
                onClick={exportPng}
                className="px-2 py-1.5 text-left hover:bg-zinc-900 hover:text-white cursor-pointer transition-colors"
              >
                Download PNG
              </button>
              <button
                type="button"
                onClick={exportSvg}
                className="px-2 py-1.5 text-left hover:bg-zinc-900 hover:text-white cursor-pointer transition-colors"
              >
                Download SVG
              </button>
              <button
                type="button"
                onClick={exportLibrary}
                className="px-2 py-1.5 text-left hover:bg-zinc-900 hover:text-white cursor-pointer transition-colors border-t border-[#1f1f1f] mt-1 pt-1.5"
              >
                Backup Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
