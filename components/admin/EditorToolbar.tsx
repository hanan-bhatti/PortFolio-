"use client";

/**
 * @file components/admin/EditorToolbar.tsx
 * @description React component for EditorToolbar.tsx under the admin category.
 * 
 * @exports
 * - EditorToolbar (default): Main React component or function
 */

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing";
import { compressImages } from "@/lib/image-compress";
import {
  LuBold,
  LuItalic,
  LuUnderline,
  LuStrikethrough,
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuHeading4,
  LuList,
  LuListOrdered,
  LuQuote,
  LuCode,
  LuTerminal,
  LuMinus,
  LuAlignLeft,
  LuAlignCenter,
  LuAlignRight,
  LuHighlighter,
  LuLink,
  LuTable,
  LuYoutube,
  LuImage,
  LuLayoutGrid,
  LuGithub,
} from "react-icons/lu";

const LANGS = ["plaintext", "typescript", "javascript", "python", "bash", "json", "css", "xml", "sql", "go", "rust"] as const;
const HEADINGS = [1, 2, 3, 4] as const;

function Btn({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "rounded-none px-2 py-1 font-mono text-xs transition-colors",
        active ? "bg-amber text-black font-bold" : "text-zinc-300 hover:bg-white/5"
      )}
    >
      {children}
    </button>
  );
}

export default function EditorToolbar({ editor }: { editor: Editor }) {
  const [ytOpen, setYtOpen] = useState(false);
  const [ytUrl, setYtUrl] = useState("");

  // Table Configuration Modal States
  const [tableOpen, setTableOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableType, setTableType] = useState<"standard" | "grid">("standard");
  const [tableHeader, setTableHeader] = useState(true);

  const setLink = (): void => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL (empty to remove)", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertYoutube = (): void => {
    if (!ytUrl.trim()) return;
    editor.commands.setYoutubeVideo({ src: ytUrl.trim() });
    setYtUrl("");
    setYtOpen(false);
  };

  const insertTableConfig = (): void => {
    if (tableRows < 1 || tableCols < 1) {
      toast.error("Rows and columns must be at least 1");
      return;
    }
    if (tableType === "grid") {
      let cellsHtml = "";
      for (let i = 0; i < tableCols; i++) {
        cellsHtml += "<td><p></p></td>";
      }
      let rowsHtml = "";
      for (let j = 0; j < tableRows; j++) {
        rowsHtml += `<tr>${cellsHtml}</tr>`;
      }
      const tableHtml = `<table class="image-grid"><tbody>${rowsHtml}</tbody></table><p></p>`;
      editor.chain().focus().insertContent(tableHtml).run();
    } else {
      editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: tableHeader }).run();
    }
    setTableOpen(false);
  };

  const insertGithubEmbed = (): void => {
    const repo = window.prompt("GitHub Repository (format: owner/repo)", "");
    if (!repo) return;
    const trimmed = repo.trim();
    if (!trimmed.includes("/")) {
      toast.error("Invalid format. Must be owner/repo");
      return;
    }
    editor.chain().focus().insertContent(`<div data-github-embed="${trimmed}">[GITHUB EMBED: ${trimmed}]</div>`).run();
  };

  const currentLang = (editor.getAttributes("codeBlock").language as string | undefined) ?? "plaintext";

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-none border-b border-[#262626] bg-[#0c0c0c] p-2">
      <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <LuBold className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <LuItalic className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <LuUnderline className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <LuStrikethrough className="h-3.5 w-3.5" />
      </Btn>
      <span className="mx-1 h-5 w-px bg-[#262626]" />
      {HEADINGS.map((level) => {
        const HeadingIcon = level === 1 ? LuHeading1 : level === 2 ? LuHeading2 : level === 3 ? LuHeading3 : LuHeading4;
        return (
          <Btn
            key={level}
            title={`Heading ${level}`}
            active={editor.isActive("heading", { level })}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          >
            <HeadingIcon className="h-3.5 w-3.5" />
          </Btn>
        );
      })}
      <span className="mx-1 h-5 w-px bg-[#262626]" />
      <Btn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <LuList className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <LuListOrdered className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <LuQuote className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
        <LuCode className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <LuTerminal className="h-3.5 w-3.5" />
      </Btn>
      {editor.isActive("codeBlock") ? (
        <select
          value={currentLang}
          onChange={(e) => editor.chain().focus().updateAttributes("codeBlock", { language: e.target.value }).run()}
          className="rounded-none border border-[#262626] bg-[#0c0c0c] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 outline-none focus:border-amber"
        >
          {LANGS.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      ) : null}
      <Btn title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <LuMinus className="h-3.5 w-3.5" />
      </Btn>
      <span className="mx-1 h-5 w-px bg-[#262626]" />
      <Btn title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        <LuAlignLeft className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        <LuAlignCenter className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        <LuAlignRight className="h-3.5 w-3.5" />
      </Btn>
      <span className="mx-1 h-5 w-px bg-[#262626]" />
      <Btn title="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}>
        <LuHighlighter className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Link" active={editor.isActive("link")} onClick={setLink}>
        <LuLink className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="Insert table / grid" onClick={() => setTableOpen(true)}>
        <LuTable className="h-3.5 w-3.5" />
      </Btn>
      <Btn
        title="Insert image gallery"
        onClick={() => editor.chain().focus().insertContent({ type: "imageGallery", attrs: { images: [], columns: 3 } }).run()}
      >
        <LuLayoutGrid className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="YouTube embed" onClick={() => setYtOpen(true)}>
        <LuYoutube className="h-3.5 w-3.5" />
      </Btn>
      <Btn title="GitHub embed" onClick={insertGithubEmbed}>
        <LuGithub className="h-3.5 w-3.5" />
      </Btn>
      <div className="text-xs">
        <UploadButton
          endpoint="imageUploader"
          onBeforeUploadBegin={async (files: File[]) => {
            toast.loading("Compressing and uploading image...", { id: "editor-upload" });
            return compressImages(files);
          }}
          onClientUploadComplete={(res) => {
            const url = res[0]?.ufsUrl ?? res[0]?.url;
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
              toast.success("Image uploaded successfully", { id: "editor-upload" });
            }
          }}
          onUploadError={(error: Error) => {
            toast.error(`Upload failed: ${error.message}`, { id: "editor-upload" });
          }}
          appearance={{
            button: "h-7 rounded-none border border-[#262626] bg-black/40 px-3 text-[10px] font-mono text-zinc-300 hover:bg-zinc-900 transition-colors flex items-center gap-1",
            allowedContent: "hidden",
          }}
          content={{
            button: () => (
              <span className="flex items-center gap-1">
                <LuImage className="h-3.5 w-3.5" />
                Image
              </span>
            ),
          }}
        />
      </div>

      {ytOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm" onClick={() => setYtOpen(false)}>
          <div className="w-full max-w-md rounded-none border border-[#F59E0B] bg-[#0a0a0a] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-[#F59E0B] border-b border-[#262626] pb-3">Embed YouTube video</h3>
            <input
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-none border border-[#262626] bg-[#0c0c0c] px-3 py-2 font-mono text-xs text-white placeholder-zinc-600 outline-none focus:border-[#F59E0B]"
            />
            <div className="mt-6 flex justify-end gap-3 font-mono text-[10px] font-bold uppercase tracking-widest">
              <button type="button" onClick={() => setYtOpen(false)} className="border border-[#262626] bg-black/40 px-4 py-2.5 text-zinc-300 hover:bg-zinc-900 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={insertYoutube} className="bg-[#F59E0B] px-4 py-2.5 text-black hover:bg-[#F59E0B]/90 transition-colors">
                Embed
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {tableOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm" onClick={() => setTableOpen(false)}>
          <div className="w-full max-w-md rounded-none border border-[#F59E0B] bg-[#0a0a0a] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-[#F59E0B] border-b border-[#262626] pb-3">
              Table / Grid Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Type</label>
                <div className="flex gap-2 font-mono text-[10px] font-bold uppercase tracking-widest">
                  <button
                    type="button"
                    onClick={() => setTableType("standard")}
                    className={cn(
                      "flex-1 border px-3 py-2 text-center transition-colors cursor-pointer rounded-none",
                      tableType === "standard"
                        ? "border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B]"
                        : "border-[#262626] bg-black/40 text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    Standard Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableType("grid")}
                    className={cn(
                      "flex-1 border px-3 py-2 text-center transition-colors cursor-pointer rounded-none",
                      tableType === "grid"
                        ? "border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B]"
                        : "border-[#262626] bg-black/40 text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    Image Grid
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Columns (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={tableCols}
                    onChange={(e) => setTableCols(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
                    className="w-full rounded-none border border-[#262626] bg-[#0c0c0c] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Rows (1-20)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={tableRows}
                    onChange={(e) => setTableRows(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
                    className="w-full rounded-none border border-[#262626] bg-[#0c0c0c] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#F59E0B]"
                  />
                </div>
              </div>

              {tableType === "standard" && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={tableHeader}
                    onChange={(e) => setTableHeader(e.target.checked)}
                    className="h-3.5 w-3.5 rounded-none border border-[#262626] bg-[#0c0c0c] text-amber focus:ring-0 outline-none"
                  />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Include Header Row</span>
                </label>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 font-mono text-[10px] font-bold uppercase tracking-widest">
              <button
                type="button"
                onClick={() => setTableOpen(false)}
                className="border border-[#262626] bg-black/40 px-4 py-2.5 text-zinc-300 hover:bg-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertTableConfig}
                className="bg-[#F59E0B] px-4 py-2.5 text-black hover:bg-[#F59E0B]/90 transition-colors"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
