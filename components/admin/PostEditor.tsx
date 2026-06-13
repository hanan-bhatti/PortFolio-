"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import { generateHTML } from "@tiptap/html";
import Image from "next/image";
import { toast } from "sonner";
import { baseExtensions } from "@/lib/tiptap-extensions";
import { slugify, cn } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing";
import { createPostAction, updatePostAction } from "@/lib/actions";
import EditorToolbar from "@/components/admin/EditorToolbar";

export interface PostEditorData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  tags: string[];
  published: boolean;
}

function parseContent(content: string): JSONContent | string {
  try {
    return JSON.parse(content) as JSONContent;
  } catch {
    return "";
  }
}

export default function PostEditor({ post }: { post: PostEditorData | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [coverImage, setCoverImage] = useState<string | null>(post?.coverImage ?? null);
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const editor = useEditor({
    extensions: [
      ...baseExtensions(),
      CharacterCount,
      Placeholder.configure({ placeholder: "Write your post..." }),
    ],
    content: post ? parseContent(post.content) : "",
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "prose-blog min-h-[420px] px-4 py-3 focus:outline-none" },
    },
  });

  const onTitleChange = (value: string): void => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const addTag = (): void => {
    const value = tagInput.trim().replace(/,+$/, "");
    if (value && !tags.includes(value)) setTags([...tags, value]);
    setTagInput("");
  };

  const save = (published: boolean): void => {
    if (!editor) return;
    if (!title.trim() || !slug.trim() || !excerpt.trim()) {
      toast.error("Title, slug and excerpt are required");
      return;
    }
    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content: JSON.stringify(editor.getJSON()),
      coverImage,
      tags,
      published,
    };
    startTransition(async () => {
      const res = post ? await updatePostAction(post.id, payload) : await createPostAction(payload);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(published ? "Post published!" : "Draft saved");
        router.push("/admin/posts");
        router.refresh();
      }
    });
  };

  const previewHtml = showPreview && editor ? generateHTML(editor.getJSON(), baseExtensions()) : "";
  const charCount = editor ? editor.storage.characterCount.characters() : 0;

  const inputClass =
    "w-full rounded-none border border-[#262626] bg-[#0c0c0c] px-4 py-2.5 font-mono text-xs text-white placeholder-zinc-600 outline-none focus:border-amber transition-colors";

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-4">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Post title"
          className={cn(inputClass, "text-sm font-bold tracking-wide")}
        />
        <input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          placeholder="post-slug"
          className={cn(inputClass, "font-mono text-xs")}
        />
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short excerpt for cards and SEO..."
          rows={2}
          className={inputClass}
        />

        <div className="rounded-none border border-[#262626] bg-[#0c0c0c]">
          <div className="flex items-center justify-between border-b border-[#262626] bg-black/20 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className={cn(
                  "rounded-none border px-4 py-1.5 transition-colors cursor-pointer",
                  !showPreview
                    ? "border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={cn(
                  "rounded-none border px-4 py-1.5 transition-colors cursor-pointer",
                  showPreview
                    ? "border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                Preview
              </button>
            </div>
          </div>
          {showPreview ? (
            <div className="prose-blog min-h-[420px] px-4 py-3 text-zinc-300" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          ) : (
            <>
              {editor ? <EditorToolbar editor={editor} /> : null}
              <EditorContent editor={editor} />
            </>
          )}
          <div className="border-t border-[#262626] px-4 py-2 text-right font-mono text-[10px] text-zinc-550">
            {charCount} characters
          </div>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-4">
          <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Cover image</p>
          {coverImage ? (
            <div className="relative mb-3 h-36 w-full overflow-hidden border border-[#262626] bg-black/20 rounded-none">
              <Image src={coverImage} alt="Cover" fill className="object-cover" />
              <button
                type="button"
                onClick={() => setCoverImage(null)}
                className="absolute top-2 right-2 rounded-none bg-black/80 border border-red-500/20 px-2 py-0.5 text-[10px] font-mono text-red-450 hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            </div>
          ) : null}
          <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              const url = res[0]?.url;
              if (url) setCoverImage(url);
            }}
            onUploadError={(error: Error) => {
              toast.error(`Upload failed: ${error.message}`);
            }}
            appearance={{
              button: "w-full rounded-none border border-dashed border-[#262626] hover:border-amber py-3 text-xs font-bold font-mono uppercase tracking-widest text-zinc-400 hover:text-amber bg-black/20 transition-colors cursor-pointer text-center",
              allowedContent: "hidden",
            }}
          />
        </div>

        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-4">
          <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">Tags</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="group/tag inline-flex items-center gap-1 font-mono text-[10px] border border-[#262626] px-[10px] py-[3px] bg-white/[0.03] text-zinc-300 rounded-none cursor-default"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  className="text-red-400 hover:text-red-500 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add tag, press Enter"
            className={inputClass}
          />
        </div>

        <div className="space-y-3 rounded-none border border-[#262626] bg-[#0c0c0c] p-4">
          <button
            type="button"
            disabled={isPending}
            onClick={() => save(false)}
            className="w-full rounded-none border border-[#262626] bg-black/40 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-zinc-300 hover:bg-zinc-900 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => save(true)}
            className="w-full rounded-none bg-amber border border-amber py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-black hover:bg-amber/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Saving..." : "Publish"}
          </button>
        </div>
      </aside>
    </div>
  );
}
