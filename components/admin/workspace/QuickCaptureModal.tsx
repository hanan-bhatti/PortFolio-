"use client";

import { useEffect, useState, useRef } from "react";
import { FiX, FiCheck, FiCpu } from "react-icons/fi";
import { cn } from "@/lib/utils";
import InfoTooltip from "../InfoTooltip";

interface ProjectOption {
  id: string;
  title: string;
}

interface QuickCaptureModalProps {
  isOpen: boolean;
  projects: ProjectOption[];
  onClose: () => void;
  onSave: (payload: {
    type: "note" | "blog-idea" | "task";
    content: string;
    projectId?: string;
  }) => void;
}

export default function QuickCaptureModal({ isOpen, projects, onClose, onSave }: QuickCaptureModalProps) {
  const [content, setContent] = useState("");
  const [type, setType] = useState<"note" | "blog-idea" | "task">("note");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      setContent("");
      setType("note");
      setSelectedProjectId("");
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle command + Enter shortcut to save
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, content, type, selectedProjectId]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!content.trim()) return;
    onSave({
      type,
      content,
      ...(type === "task" && selectedProjectId ? { projectId: selectedProjectId } : {}),
    });
    setContent("");
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity" onClick={onClose} />

      {/* Centered Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none select-none">
        <div className="w-full max-w-[600px] bg-[#0c0c0c] border border-amber/40 shadow-2xl p-5 flex flex-col justify-between pointer-events-auto rounded-none">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#262626] pb-2.5 mb-4">
            <span className="font-mono text-[9px] font-bold text-amber uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
              <FiCpu className="h-3.5 w-3.5" /> Quick Capture
              <InfoTooltip content="Use hotkey ⌘K to open. Quickly save notes, tasks, or blog ideas from anywhere inside the workspace." />
            </span>
            <button onClick={onClose} className="text-zinc-550 hover:text-white transition-colors">
              <FiX className="h-4 w-4" />
            </button>
          </div>

          {/* Input Textarea */}
          <textarea
            ref={textareaRef}
            rows={8}
            placeholder="Type page content, notes, or project tasks..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-black/45 border border-[#262626] p-3 text-xs text-white outline-none focus:border-amber rounded-none font-sans leading-relaxed resize-none placeholder-zinc-650"
          />

          {/* Form Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4 pt-3 border-t border-[#262626]/40 font-mono text-[10px]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-550 uppercase">Type:</span>
                {(["note", "blog-idea", "task"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "px-2 py-0.5 border font-bold uppercase transition-colors rounded-none outline-none",
                      type === t
                        ? "border-amber bg-amber/5 text-amber"
                        : "border-[#262626] text-zinc-500 hover:border-zinc-400"
                    )}
                  >
                    {t.replace("-", " ")}
                  </button>
                ))}
              </div>

              {/* Task project reference */}
              {type === "task" && projects.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-550 uppercase">Project:</span>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="bg-[#0c0c0c] border border-[#262626] p-1 text-white outline-none text-[9px] rounded-none font-bold"
                  >
                    <option value="">-- Standalone --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Save Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-[8px] text-zinc-600 font-normal hidden sm:inline uppercase">
                ⌘+Enter to Save
              </span>
              <button
                onClick={handleSave}
                disabled={!content.trim()}
                className="bg-amber/15 border border-amber/35 text-amber hover:bg-amber/25 font-bold uppercase px-4 py-1.5 transition-colors rounded-none flex items-center gap-1 shrink-0"
              >
                <FiCheck className="h-3 w-3" /> Save Capture
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
