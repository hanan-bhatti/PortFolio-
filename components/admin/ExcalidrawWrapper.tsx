"use client";

import { useState } from "react";
import { Excalidraw, useHandleLibrary } from "@excalidraw/excalidraw";

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

  return (
    <Excalidraw
      theme="dark"
      initialData={initialData}
      onChange={onChange}
      onLibraryChange={onLibraryChange}
      excalidrawAPI={(api) => setExcalidrawAPI(api)}
    />
  );
}
