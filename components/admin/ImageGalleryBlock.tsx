"use client";

/**
 * @file components/admin/ImageGalleryBlock.tsx
 * @description React component rendered inside the Tiptap editor for managing an image gallery block.
 * 
 * @exports
 * - ImageGalleryBlock (default): Main React component for managing and rendering image gallery nodes.
 */

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { toast } from "sonner";
import { 
  LuTrash2, 
  LuArrowLeft, 
  LuArrowRight, 
  LuPlus, 
  LuLayoutGrid,
  LuColumns3,
  LuColumns4,
  LuColumns2
} from "react-icons/lu";
import { UploadButton } from "@/lib/uploadthing";
import { compressImages } from "@/lib/image-compress";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function ImageGalleryBlock({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const images = (node.attrs.images as string[]) || [];
  const columns = (node.attrs.columns as number) || 3;

  const removeImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    updateAttributes({ images: updated });
    toast.success("Image removed from gallery");
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = [...images];
    const temp = updated[index] as string;
    const targetVal = updated[targetIndex] as string;
    updated[index] = targetVal;
    updated[targetIndex] = temp;

    updateAttributes({ images: updated });
  };

  return (
    <NodeViewWrapper className="my-6 border border-[#262626] bg-[#0c0c0c] p-4 rounded-none relative group/gallery">
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <LuLayoutGrid className="h-3.5 w-3.5 text-amber" /> Image Gallery
          </span>
          <div className="flex border border-[#262626] p-0.5 bg-black/40">
            {([2, 3, 4] as const).map((cols) => {
              const Icon = cols === 2 ? LuColumns2 : cols === 3 ? LuColumns3 : LuColumns4;
              return (
                <button
                  key={cols}
                  type="button"
                  title={`${cols} Columns`}
                  onClick={() => updateAttributes({ columns: cols })}
                  className={cn(
                    "p-1 hover:bg-white/5 transition-colors cursor-pointer rounded-none",
                    columns === cols ? "bg-amber text-black" : "text-zinc-400"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={deleteNode}
          className="font-mono text-[9px] font-bold uppercase tracking-widest bg-red-950/40 hover:bg-red-900/40 border border-red-500/20 text-red-400 px-2.5 py-1.5 transition-colors cursor-pointer"
        >
          Remove Gallery
        </button>
      </div>

      {/* Grid Display */}
      {images.length > 0 ? (
        <div 
          className={cn(
            "grid gap-3 mb-4",
            columns === 2 && "grid-cols-2",
            columns === 3 && "grid-cols-3",
            columns === 4 && "grid-cols-4"
          )}
        >
          {images.map((src, idx) => (
            <div 
              key={`${src}-${idx}`} 
              className="relative aspect-square border border-[#262626] bg-black/20 group/item overflow-hidden"
            >
              <Image 
                src={src} 
                alt={`Gallery image ${idx + 1}`} 
                fill 
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover/item:scale-105" 
              />
              
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                {idx > 0 && (
                  <button
                    type="button"
                    title="Move Left"
                    onClick={() => moveImage(idx, "left")}
                    className="p-1.5 bg-black/80 border border-[#262626] text-white hover:text-amber transition-colors cursor-pointer rounded-none"
                  >
                    <LuArrowLeft className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  title="Remove Image"
                  onClick={() => removeImage(idx)}
                  className="p-1.5 bg-red-950/80 border border-red-500/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer rounded-none"
                >
                  <LuTrash2 className="h-3.5 w-3.5" />
                </button>
                {idx < images.length - 1 && (
                  <button
                    type="button"
                    title="Move Right"
                    onClick={() => moveImage(idx, "right")}
                    className="p-1.5 bg-black/80 border border-[#262626] text-white hover:text-amber transition-colors cursor-pointer rounded-none"
                  >
                    <LuArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border border-dashed border-[#262626] bg-black/20 py-8 mb-4 font-mono text-[10px] text-zinc-500">
          No images in gallery yet
        </div>
      )}

      {/* Add more images button */}
      <div className="flex justify-center">
        <UploadButton
          endpoint="imageUploader"
          onBeforeUploadBegin={async (files: File[]) => {
            toast.loading("Compressing and uploading gallery images...", { id: "gallery-upload" });
            return compressImages(files);
          }}
          onClientUploadComplete={(res) => {
            const urls = res.map((item) => item.url).filter(Boolean);
            if (urls.length > 0) {
              updateAttributes({ images: [...images, ...urls] });
              toast.success("Images added to gallery successfully!", { id: "gallery-upload" });
            }
          }}
          onUploadError={(error: Error) => {
            toast.error(`Upload failed: ${error.message}`, { id: "gallery-upload" });
          }}
          appearance={{
            button: "rounded-none border border-dashed border-[#262626] hover:border-amber py-3 px-6 text-xs font-bold font-mono uppercase tracking-widest text-zinc-400 hover:text-amber bg-black/20 transition-colors cursor-pointer text-center flex items-center gap-1.5",
            allowedContent: "hidden",
          }}
          content={{
            button: () => (
              <span className="flex items-center gap-1.5">
                <LuPlus className="h-3.5 w-3.5 animate-pulse" />
                Add Images
              </span>
            )
          }}
        />
      </div>
    </NodeViewWrapper>
  );
}
