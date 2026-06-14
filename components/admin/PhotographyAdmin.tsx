"use client";

/**
 * @file components/admin/PhotographyAdmin.tsx
 * @description React component for PhotographyAdmin.tsx under the admin category.
 * 
 * @exports
 * - PhotographyAdmin (default): Main React component or function
 */

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useUploadThing } from "@/lib/uploadthing";
import { toast } from "sonner";
import EditorialModal from "./EditorialModal";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Photo {
  id: string;
  title: string | null;
  imageUrl: string;
  order: number;
  visible: boolean;
  exif_data?: any;
}

const renderExifSummary = (exif: any) => {
  if (!exif) return "No EXIF data";

  const parts = [];
  const model = exif.model || exif.make;
  if (model) parts.push(model);

  if (exif.fNumber !== undefined && exif.fNumber !== null) {
    parts.push(`f/${exif.fNumber}`);
  }
  if (exif.iso !== undefined && exif.iso !== null) {
    parts.push(`ISO ${exif.iso}`);
  }

  return parts.length > 0 ? parts.join(" · ") : "No EXIF data";
};

interface PhotographyAdminProps {
  initialPhotos: Photo[];
  initialEnabled: string;
  initialTitle: string;
  initialDescription: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function PhotographyAdmin({
  initialPhotos,
  initialEnabled,
  initialTitle,
  initialDescription,
}: PhotographyAdminProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [enabled, setEnabled] = useState(initialEnabled === "true");
  const [pageTitle, setPageTitle] = useState(initialTitle);
  const [pageDesc, setPageDesc] = useState(initialDescription);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Real-time progress states
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processingCount, setProcessingCount] = useState<number | null>(null);
  const [processedCount, setProcessedCount] = useState<number>(0);

  // drag state
  const dragIdx = useRef<number | null>(null);

  // ── Settings save ─────────────────────────────────────────────────────────
  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/photography-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photography_enabled: enabled ? "true" : "false",
          photography_title: pageTitle,
          photography_description: pageDesc,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Settings saved.");
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const { startUpload } = useUploadThing("photoUploader", {
    onUploadProgress: (p) => {
      setUploadProgress(p);
    },
    onClientUploadComplete: async (files) => {
      setProcessingCount(files.length);
      setProcessedCount(0);

      // Create DB records for each uploaded file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        const url = file.ufsUrl ?? (file as unknown as { url: string }).url;
        try {
          const res = await fetch("/api/photos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: url }),
          });
          if (!res.ok) throw new Error();
          const { photo } = (await res.json()) as { photo: Photo };
          setPhotos((prev) => [...prev, photo]);
        } catch {
          toast.error(`Failed to save photo: ${url}`);
        }
        setProcessedCount(i + 1);
      }

      setUploading(false);
      setProcessingCount(null);
      setUploadProgress(0);
      toast.success("Photos uploaded and processed successfully.");
    },
    onUploadError: () => {
      setUploading(false);
      setProcessingCount(null);
      setUploadProgress(0);
      toast.error("Upload failed. Please try again.");
    },
  });

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;
      setUploading(true);
      await startUpload(files);
      e.target.value = "";
    },
    [startUpload]
  );

  // ── Photo mutations ───────────────────────────────────────────────────────
  const patchPhoto = async (id: string, data: Partial<Pick<Photo, "title" | "visible" | "order">>) => {
    await fetch(`/api/photos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  const updateTitle = (id: string, title: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, title } : p)));
  };

  const saveTitle = async (id: string, title: string) => {
    await patchPhoto(id, { title });
  };

  const toggleVisible = async (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (!photo) return;
    const next = !photo.visible;
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, visible: next } : p)));
    await patchPhoto(id, { visible: next });
  };

  const confirmDeletePhoto = async () => {
    if (!deleteId) return;
    await fetch(`/api/photos/${deleteId}`, { method: "DELETE" });
    setPhotos((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
    toast.success("Photo deleted.");
  };

  // ── Drag-to-reorder ───────────────────────────────────────────────────────
  const onDragStart = (idx: number) => { dragIdx.current = idx; };

  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    const from = dragIdx.current;
    if (from === null || from === idx) return;
    setPhotos((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      if (moved) {
        next.splice(idx, 0, moved);
      }
      dragIdx.current = idx;
      return next;
    });
  };

  const onDrop = async () => {
    dragIdx.current = null;
    const order = photos.map((p, i) => ({ id: p.id, order: i }));
    await fetch("/api/photos/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: "900px" }} className="font-mono text-xs">
      {/* ── Page Settings ─────────────────────────────────── */}
      <section className="mb-10 border border-[#262626] bg-[#0c0c0c] p-6">
        <h2 className="mb-6 font-syne text-sm font-bold text-white uppercase tracking-wider">Page Settings</h2>

        {/* Enabled toggle */}
        <div className="mb-5 flex items-center justify-between border-b border-[#262626] pb-4">
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider">Enable Photography Section</h3>
            <p className="text-[10px] text-zinc-550">Show or hide the photography link and page on your website.</p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-all ${
              enabled
                ? "border-[#10B981] bg-[#10B981]/10 text-[#10B981]"
                : "border-[#262626] bg-black text-zinc-500 hover:border-zinc-500"
            }`}
          >
            {enabled ? "ON" : "OFF"}
          </button>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Page Title
          </label>
          <input
            type="text"
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
            className="w-full border border-[#262626] bg-black/45 px-3 py-2.5 font-mono text-xs text-white placeholder-zinc-650 outline-none focus:border-[#F59E0B]"
            placeholder="Through My Lens"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Page Description
          </label>
          <input
            type="text"
            value={pageDesc}
            onChange={(e) => setPageDesc(e.target.value)}
            className="w-full border border-[#262626] bg-black/45 px-3 py-2.5 font-mono text-xs text-white placeholder-zinc-650 outline-none focus:border-[#F59E0B]"
            placeholder="Moments captured on budget devices."
          />
        </div>

        <button
          type="button"
          onClick={saveSettings}
          disabled={savingSettings}
          className="border border-[#F59E0B] bg-[#F59E0B]/10 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-[#F59E0B] hover:bg-[#F59E0B]/25 disabled:opacity-30 transition-all cursor-pointer"
        >
          {savingSettings ? "Saving…" : "Save Settings"}
        </button>
      </section>

      {/* ── Upload Area ───────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="mb-4 font-syne text-sm font-bold text-white uppercase tracking-wider">Upload Photos</h2>
        {uploading ? (
          <div className="flex flex-col items-center justify-center gap-4 border border-[#262626] bg-[#0c0c0c] p-10 text-center">
            <div className="relative h-12 w-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-[#F59E0B] border-r-transparent border-b-transparent border-l-transparent" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                {processingCount !== null
                  ? `Processing photos: ${processedCount} of ${processingCount} saved`
                  : `Uploading to CDN (${uploadProgress}%)`}
              </p>
              <p className="text-xs text-zinc-500">
                {processingCount !== null
                  ? "Extracting EXIF metadata and reverse geocoding locations..."
                  : "Sending your images to secure storage..."}
              </p>
            </div>

            {/* Custom progress bar */}
            <div className="w-full max-w-xs bg-zinc-900 h-1.5 overflow-hidden">
              <div
                className="bg-[#F59E0B] h-full transition-all duration-300"
                style={{
                  width:
                    processingCount !== null
                      ? `${(processedCount / processingCount) * 100}%`
                      : `${uploadProgress}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed border-[#262626] bg-[#0c0c0c] p-10 text-center transition hover:border-[#F59E0B]/40">
            <span className="text-2xl">📷</span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Click to select images
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
              PNG, JPG, WEBP • up to 16MB • multiple at once
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        )}
      </section>

      {/* ── Photo Grid ────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 font-syne text-sm font-bold text-white uppercase tracking-wider">
          Photos{" "}
          <span className="font-mono text-xs font-normal text-zinc-500">
            ({photos.length})
          </span>
        </h2>

        {photos.length === 0 ? (
          <p className="text-sm text-zinc-650 font-mono">No photos yet. Upload some above.</p>
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
          >
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDrop={onDrop}
                className="group relative border border-[#262626] bg-[#0c0c0c] overflow-hidden"
              >
                {/* Drag handle */}
                <span
                  className="absolute left-2 top-2 z-10 cursor-grab select-none border border-[#262626] bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity active:cursor-grabbing"
                  title="Drag to reorder"
                >
                  ⠿
                </span>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => setDeleteId(photo.id)}
                  className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center border border-red-500 bg-red-500/10 text-xs font-bold text-red-550 opacity-0 transition-opacity hover:bg-red-500 hover:text-white group-hover:opacity-100"
                  title="Delete"
                >
                  ×
                </button>

                {/* Thumbnail */}
                <div className="relative h-40 w-full bg-zinc-900 border-b border-[#262626]">
                  <Image
                    src={photo.imageUrl}
                    alt={photo.title ?? "Photo"}
                    fill
                    className="object-cover"
                    sizes="220px"
                    unoptimized
                  />
                </div>

                {/* Controls */}
                <div className="p-3">
                  <input
                    type="text"
                    value={photo.title ?? ""}
                    onChange={(e) => updateTitle(photo.id, e.target.value)}
                    onBlur={(e) => saveTitle(photo.id, e.target.value)}
                    placeholder="Add title…"
                    className="mb-2 w-full border border-[#262626] bg-black/45 px-2 py-1 text-xs text-zinc-300 placeholder-zinc-650 outline-none focus:border-[#F59E0B]/50"
                  />

                  {/* EXIF Summary Line */}
                  <div
                    className="mb-2 font-mono text-[9px] text-zinc-500 uppercase tracking-wide"
                  >
                    {renderExifSummary(photo.exif_data)}
                  </div>

                  {/* Visibility toggle */}
                  <button
                    type="button"
                    onClick={() => toggleVisible(photo.id)}
                    className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider transition-colors ${
                      photo.visible ? "text-[#F59E0B]" : "text-zinc-650"
                    }`}
                    title={photo.visible ? "Visible — click to hide" : "Hidden — click to show"}
                  >
                    <span>{photo.visible ? "👁" : "🚫"}</span>
                    <span>{photo.visible ? "Visible" : "Hidden"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Editorial Delete Confirmation Modal */}
      <EditorialModal
        isOpen={deleteId !== null}
        type="danger"
        title="Delete Photo?"
        description="Are you sure you want to permanently delete this photo from your catalog? This cannot be undone."
        confirmLabel="Delete Photo"
        cancelLabel="Cancel"
        onConfirm={confirmDeletePhoto}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
