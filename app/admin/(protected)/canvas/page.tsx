"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

export default function CanvasPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] w-full border border-[#262626] bg-[#0c0c0c] rounded-none overflow-hidden relative">
      <div className="border-b border-[#262626] px-6 py-4 bg-[#0c0c0c] flex items-center justify-between select-none">
        <h1 className="font-syne font-extrabold text-lg text-white uppercase tracking-tight">
          Excalidraw Canvas
        </h1>
      </div>
      <div className="flex-1 w-full bg-black relative">
        <Excalidraw theme="dark" />
      </div>
    </div>
  );
}
