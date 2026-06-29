"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

import CalloutNode from "./CalloutNode";
import LinkPreviewNode from "./LinkPreviewNode";
import SlashCommandExtension from "./SlashCommandExtension";
import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface BlockEditorProps {
  initialContent: string;
  onChange: (jsonContent: string) => void;
  statusIndicator?: "idle" | "saving" | "saved";
}

const COMMANDS = [
  { label: "Text", desc: "Start writing plain paragraph text", action: (editor: any) => editor.chain().focus().clearNodes().run() },
  { label: "Heading 1", desc: "Large page heading", action: (editor: any) => editor.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: "Heading 2", desc: "Medium section heading", action: (editor: any) => editor.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: "Heading 3", desc: "Small section heading", action: (editor: any) => editor.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: "Bullet List", desc: "Simple bulleted list", action: (editor: any) => editor.chain().focus().toggleBulletList().run() },
  { label: "Numbered List", desc: "Sequential numbered list", action: (editor: any) => editor.chain().focus().toggleOrderedList().run() },
  { label: "To-do List", desc: "Checkbox task list", action: (editor: any) => editor.chain().focus().toggleTaskList().run() },
  { label: "Code Block", desc: "Preformatted code snippet", action: (editor: any) => editor.chain().focus().toggleCodeBlock().run() },
  { label: "Blockquote", desc: "Capture block quotes", action: (editor: any) => editor.chain().focus().toggleBlockquote().run() },
  { label: "Divider", desc: "Horizontal divider line", action: (editor: any) => editor.chain().focus().setHorizontalRule().run() },
  { label: "💡 Tip Callout", desc: "Highlight amber tip box", action: (editor: any) => editor.chain().focus().insertContent({ type: "callout", attrs: { type: "tip" } }).run() },
  { label: "⚠️ Warning Callout", desc: "Highlight warning alert box", action: (editor: any) => editor.chain().focus().insertContent({ type: "callout", attrs: { type: "warning" } }).run() },
  { label: "ℹ️ Info Callout", desc: "Highlight blue information box", action: (editor: any) => editor.chain().focus().insertContent({ type: "callout", attrs: { type: "info" } }).run() },
  { label: "❌ Error Callout", desc: "Highlight red error alert box", action: (editor: any) => editor.chain().focus().insertContent({ type: "callout", attrs: { type: "error" } }).run() },
  { label: "Embed Link Preview", desc: "Rich preview card from URL", action: (editor: any) => {
      const url = prompt("Enter URL to embed:");
      if (url) {
        editor.chain().focus().insertContent({ type: "linkPreview", attrs: { url } }).run();
      }
    }
  }
];

export default function BlockEditor({ initialContent, onChange, statusIndicator = "idle" }: BlockEditorProps) {
  const [slashPosition, setSlashPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const slashMenuRef = useRef<HTMLDivElement>(null);

  const lowlight = createLowlight(common);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disabled to use codeBlockLowlight
      }),
      Placeholder.configure({
        placeholder: "Start writing, or type '/' for commands...",
      }),
      Link.configure({
        openOnClick: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CharacterCount,
      Typography,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      CalloutNode,
      LinkPreviewNode,
      SlashCommandExtension.configure({
        onTrigger: (pos) => {
          setSlashPosition(pos);
          setSelectedIndex(0);
        },
      }),
    ],
    content: (() => {
      try {
        return JSON.parse(initialContent);
      } catch (e) {
        return initialContent || "";
      }
    })(),
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-amber max-w-none focus:outline-none min-h-[400px] text-zinc-350 font-sans text-sm tracking-wide leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
  });

  // Handle outside click to dismiss slash menu
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (slashPosition && slashMenuRef.current && !slashMenuRef.current.contains(e.target as Node)) {
        setSlashPosition(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [slashPosition]);

  // Keyboard navigation for slash menu
  useEffect(() => {
    if (!slashPosition || !editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % COMMANDS.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + COMMANDS.length) % COMMANDS.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        
        // Remove the "/" typed
        const { state } = editor;
        const { from } = state.selection;
        editor.chain().focus().deleteRange({ from: from - 1, to: from }).run();

        // Run command
        COMMANDS[selectedIndex]?.action(editor);
        setSlashPosition(null);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSlashPosition(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [slashPosition, selectedIndex, editor]);

  // Load new content if initialContent changes externally
  useEffect(() => {
    if (editor && initialContent) {
      let parsed = "";
      try {
        parsed = JSON.parse(initialContent);
      } catch (e) {
        parsed = initialContent;
      }
      
      const currentJSON = JSON.stringify(editor.getJSON());
      if (JSON.stringify(parsed) !== currentJSON) {
        editor.commands.setContent(parsed);
      }
    }
  }, [initialContent, editor]);

  const wordCount = editor?.storage.characterCount.words() || 0;

  return (
    <div className="relative w-full">
      {/* Editor Content Area */}
      <div className="min-h-[400px]">
        <EditorContent editor={editor} />
      </div>

      {/* Floating Slash Commands Menu */}
      {slashPosition && (
        <div
          ref={slashMenuRef}
          className="absolute z-50 bg-[#0c0c0c] border border-[#262626] w-[280px] max-h-[250px] overflow-y-auto shadow-2xl p-1 animate-fadeIn select-none rounded-none"
          style={{
            top: `${slashPosition.top - 80}px`,
            left: `${slashPosition.left}px`,
          }}
        >
          <div className="px-2 py-1.5 border-b border-[#262626] font-mono text-[8px] font-bold text-zinc-550 uppercase tracking-widest">
            Workspace blocks
          </div>
          <div className="space-y-0.5 mt-1">
            {COMMANDS.map((cmd, idx) => (
              <button
                key={cmd.label}
                onClick={() => {
                  if (editor) {
                    const { state } = editor;
                    const { from } = state.selection;
                    editor.chain().focus().deleteRange({ from: from - 1, to: from }).run();
                    cmd.action(editor);
                    setSlashPosition(null);
                  }
                }}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 flex flex-col transition-colors rounded-none outline-none",
                  selectedIndex === idx ? "bg-amber/15 text-white" : "hover:bg-zinc-900/60"
                )}
              >
                <span className={cn("font-mono text-[10px] font-bold", selectedIndex === idx ? "text-amber" : "text-zinc-200")}>
                  {cmd.label}
                </span>
                <span className="text-[8px] text-zinc-500 font-sans tracking-wide mt-0.5">{cmd.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Footer Info */}
      <div className="flex items-center justify-between border-t border-[#262626]/40 mt-8 pt-3 font-mono text-[9px] text-zinc-650 uppercase tracking-wider">
        <div>
          {statusIndicator === "saving" && <span className="text-amber animate-pulse">Saving changes...</span>}
          {statusIndicator === "saved" && <span className="text-[#10B981]">Saved ✓</span>}
          {statusIndicator === "idle" && <span className="text-zinc-500">Workspace ready</span>}
        </div>
        <div>{wordCount} words</div>
      </div>
    </div>
  );
}
