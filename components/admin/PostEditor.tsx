"use client";

/**
 * @file components/admin/PostEditor.tsx
 * @description React component for PostEditor.tsx under the admin category.
 * 
 * @exports
 * - PostEditor (default): Main React component or function
 * - PostEditorData: Type/Interface definition
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import { generateHTML } from "@tiptap/html";
import Image from "next/image";
import { toast } from "sonner";
import { baseExtensions, ImageGalleryNode } from "@/lib/tiptap-extensions";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ImageGalleryBlock from "@/components/admin/ImageGalleryBlock";
import { slugify, cn } from "@/lib/utils";
import { UploadButton, useUploadThing } from "@/lib/uploadthing";
import { compressImage, compressImages } from "@/lib/image-compress";
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

  const { startUpload } = useUploadThing("imageUploader");

  const uploadImageFile = async (file: File): Promise<string | null> => {
    try {
      const toastId = toast.loading("Compressing and uploading image...", { id: "editor-drag-drop" });
      const compressed = await compressImage(file);
      const res = await startUpload([compressed]);
      if (res && res[0]) {
        toast.success("Image uploaded successfully!", { id: "editor-drag-drop" });
        return res[0].url;
      }
      toast.error("Upload failed: No URL returned", { id: "editor-drag-drop" });
      return null;
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`, { id: "editor-drag-drop" });
      return null;
    }
  };

  const editor = useEditor({
    extensions: [
      ...baseExtensions().filter((ext) => ext.name !== "imageGallery"),
      ImageGalleryNode.extend({
        addNodeView() {
          return ReactNodeViewRenderer(ImageGalleryBlock);
        },
      }),
      CharacterCount,
      Placeholder.configure({ placeholder: "Write your post..." }),
    ],
    content: post ? parseContent(post.content) : "",
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "prose-blog min-h-[420px] px-4 py-3 focus:outline-none" },
      handleDrop(view, event, slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const file = event.dataTransfer.files[0];
          if (file && file.type.startsWith("image/")) {
            event.preventDefault();
            uploadImageFile(file).then((url) => {
              if (url) {
                const { schema } = view.state;
                if (schema.nodes.image) {
                  const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                  const node = schema.nodes.image.create({ src: url });
                  const transaction = view.state.tr.insert(coordinates?.pos ?? view.state.selection.from, node);
                  view.dispatch(transaction);
                }
              }
            });
            return true;
          }
        }
        return false;
      },
      handlePaste(view, event, slice) {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.startsWith("image/"));
        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) {
            event.preventDefault();
            uploadImageFile(file).then((url) => {
              if (url) {
                const { schema } = view.state;
                if (schema.nodes.image) {
                  const node = schema.nodes.image.create({ src: url });
                  const transaction = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(transaction);
                }
              }
            });
            return true;
          }
        }
        return false;
      }
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
    <div className="grid gap-6 xl:grid-cols-[1fr_320px] pb-24 xl:pb-0">
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
          <div className={cn("prose-blog min-h-[420px] px-4 py-3 text-zinc-300", showPreview ? "block" : "hidden")} dangerouslySetInnerHTML={{ __html: previewHtml }} />
          <div className={!showPreview ? "block" : "hidden"}>
            {editor ? <EditorToolbar editor={editor} /> : null}
            <EditorContent editor={editor} />
            {editor && (
              <BubbleMenu
                editor={editor}
                tippyOptions={{ duration: 100 }}
                shouldShow={({ editor }) => editor.isActive("image")}
              >
                <div className="flex items-center gap-1 border border-[#262626] bg-[#0c0c0c] p-1 font-mono text-xs shadow-lg">
                  <span className="px-2 text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Size:</span>
                  {(["25%", "50%", "75%", "100%"] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => editor.chain().focus().updateAttributes("image", { width: sz }).run()}
                      className={cn(
                        "px-2 py-0.5 hover:bg-white/5 transition-colors cursor-pointer text-[10px]",
                        editor.getAttributes("image").width === sz || (!editor.getAttributes("image").width && sz === "100%")
                          ? "bg-amber text-black font-bold"
                          : "text-zinc-300"
                      )}
                    >
                      {sz}
                    </button>
                  ))}
                  <span className="mx-1 h-4 w-px bg-[#262626]" />
                  <span className="px-2 text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Align:</span>
                  {(["left", "center", "right"] as const).map((al) => (
                    <button
                      key={al}
                      type="button"
                      onClick={() => editor.chain().focus().updateAttributes("image", { alignment: al }).run()}
                      className={cn(
                        "px-2 py-0.5 hover:bg-white/5 transition-colors cursor-pointer text-[10px] capitalize",
                        editor.getAttributes("image").alignment === al || (!editor.getAttributes("image").alignment && al === "center")
                          ? "bg-amber text-black font-bold"
                          : "text-zinc-300"
                      )}
                    >
                      {al}
                    </button>
                  ))}
                </div>
              </BubbleMenu>
            )}
            {editor && (
              <BubbleMenu
                editor={editor}
                tippyOptions={{ duration: 100 }}
                shouldShow={({ editor }) => editor.isActive("table")}
              >
                <div className="flex flex-wrap items-center gap-1 border border-[#262626] bg-[#0c0c0c] p-1 font-mono text-xs shadow-lg max-w-sm sm:max-w-md">
                  <button
                    type="button"
                    title="Add Row Above"
                    onClick={() => editor.chain().focus().addRowBefore().run()}
                    className="rounded-none px-2 py-1 text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer text-[10px]"
                  >
                    +Row Above
                  </button>
                  <button
                    type="button"
                    title="Add Row Below"
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    className="rounded-none px-2 py-1 text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer text-[10px]"
                  >
                    +Row Below
                  </button>
                  <span className="mx-0.5 h-4 w-px bg-[#262626]" />
                  <button
                    type="button"
                    title="Add Column Left"
                    onClick={() => editor.chain().focus().addColumnBefore().run()}
                    className="rounded-none px-2 py-1 text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer text-[10px]"
                  >
                    +Col Left
                  </button>
                  <button
                    type="button"
                    title="Add Column Right"
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    className="rounded-none px-2 py-1 text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer text-[10px]"
                  >
                    +Col Right
                  </button>
                  <span className="mx-0.5 h-4 w-px bg-[#262626]" />
                  <button
                    type="button"
                    title="Merge Cells"
                    onClick={() => editor.chain().focus().mergeCells().run()}
                    className="rounded-none px-2 py-1 text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer text-[10px]"
                  >
                    Merge
                  </button>
                  <button
                    type="button"
                    title="Split Cell"
                    onClick={() => editor.chain().focus().splitCell().run()}
                    className="rounded-none px-2 py-1 text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer text-[10px]"
                  >
                    Split
                  </button>
                  <span className="mx-0.5 h-4 w-px bg-[#262626]" />
                  <button
                    type="button"
                    title="Delete Row"
                    onClick={() => editor.chain().focus().deleteRow().run()}
                    className="rounded-none px-2 py-1 text-red-400 hover:bg-white/5 transition-colors cursor-pointer text-[10px]"
                  >
                    Del Row
                  </button>
                  <button
                    type="button"
                    title="Delete Column"
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                    className="rounded-none px-2 py-1 text-red-400 hover:bg-white/5 transition-colors cursor-pointer text-[10px]"
                  >
                    Del Col
                  </button>
                  <button
                    type="button"
                    title="Delete Table"
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    className="rounded-none px-2 py-1 bg-red-950/40 text-red-400 hover:bg-red-900/40 border border-red-500/20 transition-colors cursor-pointer text-[10px]"
                  >
                    Delete Table
                  </button>
                </div>
              </BubbleMenu>
            )}
          </div>
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
            onBeforeUploadBegin={async (files: File[]) => {
              toast.loading("Compressing and uploading cover image...", { id: "cover-upload" });
              return compressImages(files);
            }}
            onClientUploadComplete={(res) => {
              const url = res[0]?.ufsUrl ?? res[0]?.url;
              if (url) {
                setCoverImage(url);
                toast.success("Cover image uploaded successfully!", { id: "cover-upload" });
              }
            }}
            onUploadError={(error: Error) => {
              toast.error(`Upload failed: ${error.message}`, { id: "cover-upload" });
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

        <div className="hidden xl:block space-y-3 rounded-none border border-[#262626] bg-[#0c0c0c] p-4">
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

      {/* Sticky Bottom Actions Bar for Mobile */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c0c] border-t border-[#262626] p-4 flex gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => save(false)}
          className="flex-1 rounded-none border border-[#262626] bg-black/40 py-3 font-mono text-xs font-bold uppercase tracking-widest text-zinc-300 hover:bg-zinc-900 transition-colors disabled:opacity-50 cursor-pointer text-center"
        >
          {isPending ? "Saving..." : "Draft"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => save(true)}
          className="flex-1 rounded-none bg-amber border border-amber py-3 font-mono text-xs font-bold uppercase tracking-widest text-black hover:bg-amber/90 transition-colors disabled:opacity-50 cursor-pointer text-center"
        >
          {isPending ? "Saving..." : "Publish"}
        </button>
      </div>
    </div>
  );
}
