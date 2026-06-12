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
    "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-4">
        <input value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="Post title" className={cn(inputClass, "text-lg font-semibold")} />
        <input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          placeholder="post-slug"
          className={cn(inputClass, "font-mono text-xs")}
        />
        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short excerpt for cards and SEO..." rows={2} className={inputClass} />

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101018]">
          <div className="flex items-center justify-between border-b border-white/10 bg-[#13131c] px-3 py-1.5">
            <div className="flex gap-2 text-xs">
              <button type="button" onClick={() => setShowPreview(false)} className={cn("rounded px-3 py-1", !showPreview ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white")}>
                Write
              </button>
              <button type="button" onClick={() => setShowPreview(true)} className={cn("rounded px-3 py-1", showPreview ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white")}>
                Preview
              </button>
            </div>
          </div>
          {showPreview ? (
            <div className="prose-blog min-h-[420px] px-4 py-3" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          ) : (
            <>
              {editor ? <EditorToolbar editor={editor} /> : null}
              <EditorContent editor={editor} />
            </>
          )}
          <div className="border-t border-white/10 px-4 py-2 text-right font-mono text-xs text-zinc-500">
            {charCount} characters
          </div>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-2 text-sm font-medium text-zinc-300">Cover image</p>
          {coverImage ? (
            <div className="relative mb-3 h-36 w-full overflow-hidden rounded-xl">
              <Image src={coverImage} alt="Cover" fill className="object-cover" />
              <button type="button" onClick={() => setCoverImage(null)} className="absolute top-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs text-red-400">
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
            onUploadError={(error: Error) => toast.error(`Upload failed: ${error.message}`)}
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-2 text-sm font-medium text-zinc-300">Tags</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 rounded-full bg-indigo-600/20 px-2.5 py-0.5 text-xs text-indigo-300">
                {tag}
                <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="text-indigo-400 hover:text-white">
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

        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <button type="button" disabled={isPending} onClick={() => save(false)} className="w-full rounded-xl border border-white/10 py-2.5 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-50">
            {isPending ? "Saving..." : "Save Draft"}
          </button>
          <button type="button" disabled={isPending} onClick={() => save(true)} className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
            {isPending ? "Saving..." : "Publish"}
          </button>
        </div>
      </aside>
    </div>
  );
}
