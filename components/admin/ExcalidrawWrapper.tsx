"use client";

import { useState } from "react";
import { Excalidraw, useHandleLibrary } from "@excalidraw/excalidraw";

interface ExcalidrawWrapperProps {
  initialData: any;
  onChange: (elements: readonly any[], appState: any) => void;
}

export default function ExcalidrawWrapper({ initialData, onChange }: ExcalidrawWrapperProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  // Hook to handle URL hash imports like `#addLibrary=...`
  useHandleLibrary({ excalidrawAPI });

  return (
    <Excalidraw
      theme="dark"
      initialData={initialData}
      onChange={onChange}
      excalidrawAPI={(api) => setExcalidrawAPI(api)}
    />
  );
}
