"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing";

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
        "rounded px-2 py-1 text-sm transition-colors",
        active ? "bg-indigo-600 text-white" : "text-zinc-300 hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );
}

export default function EditorToolbar({ editor }: { editor: Editor }) {
  const [ytOpen, setYtOpen] = useState(false);
  const [ytUrl, setYtUrl] = useState("");

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

  const currentLang = (editor.getAttributes("codeBlock").language as string | undefined) ?? "plaintext";

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-t-2xl border-b border-white/10 bg-[#13131c] p-2">
      <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <b>B</b>
      </Btn>
      <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <i>I</i>
      </Btn>
      <Btn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <u>U</u>
      </Btn>
      <Btn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <s>S</s>
      </Btn>
      <span className="mx-1 h-5 w-px bg-white/10" />
      {HEADINGS.map((level) => (
        <Btn
          key={level}
          title={`Heading ${level}`}
          active={editor.isActive("heading", { level })}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
        >
          H{level}
        </Btn>
      ))}
      <span className="mx-1 h-5 w-px bg-white/10" />
      <Btn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        •≡
      </Btn>
      <Btn title="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1≡
      </Btn>
      <Btn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        ”
      </Btn>
      <Btn title="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
        {"</>"}
      </Btn>
      <Btn title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        {"{ }"}
      </Btn>
      {editor.isActive("codeBlock") ? (
        <select
          value={currentLang}
          onChange={(e) => editor.chain().focus().updateAttributes("codeBlock", { language: e.target.value }).run()}
          className="rounded border border-white/10 bg-black/40 px-1.5 py-0.5 text-xs text-zinc-300"
        >
          {LANGS.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      ) : null}
      <Btn title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        ―
      </Btn>
      <span className="mx-1 h-5 w-px bg-white/10" />
      <Btn title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        ☰←
      </Btn>
      <Btn title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        ☰
      </Btn>
      <Btn title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        →☰
      </Btn>
      <span className="mx-1 h-5 w-px bg-white/10" />
      <Btn title="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}>
        ✍
      </Btn>
      <Btn title="Link" active={editor.isActive("link")} onClick={setLink}>
        🔗
      </Btn>
      <Btn title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
        ⊞
      </Btn>
      <Btn title="YouTube embed" onClick={() => setYtOpen(true)}>
        ▶
      </Btn>
      <div className="text-xs">
        <UploadButton
          endpoint="imageUploader"
          onClientUploadComplete={(res) => {
            const url = res[0]?.url;
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
          onUploadError={(error: Error) => toast.error(`Upload failed: ${error.message}`)}
          appearance={{
            button: "h-7 rounded bg-white/10 px-2 text-xs text-zinc-300 hover:bg-white/20",
            allowedContent: "hidden",
          }}
          content={{ button: "\ud83d\uddbc Image" }}
        />
      </div>

      {ytOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setYtOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#15151f] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 font-semibold text-white">Embed YouTube video</h3>
            <input
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setYtOpen(false)} className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-white/5">
                Cancel
              </button>
              <button type="button" onClick={insertYoutube} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                Embed
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
