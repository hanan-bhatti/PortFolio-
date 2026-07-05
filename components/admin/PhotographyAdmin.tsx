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
import {
  FiHeart,
  FiDownload,
  FiShare2,
  FiActivity,
  FiUser,
  FiMapPin,
  FiTerminal,
  FiGlobe,
  FiSmartphone,
  FiMonitor,
  FiTablet,
  FiSearch,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";
import {
  FaChrome,
  FaSafari,
  FaFirefox,
  FaInstagram,
  FaLinkedin,
  FaFacebook,
  FaTwitter
} from "react-icons/fa6";
import EditorialModal from "./EditorialModal";
import CelebrationPopover from "./CelebrationPopover";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Photo {
  id: string;
  title: string | null;
  imageUrl: string;
  order: number;
  visible: boolean;
  exif_data?: any;
  likes: number;
  downloads: number;
  shares: number;
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

interface Interaction {
  id: string;
  photoId: string;
  photoTitle: string;
  photoImageUrl: string;
  visitorId: string;
  type: string;
  createdAt: string;
  geo: {
    country: string;
    city: string;
    device: string;
    browser: string;
  } | null;
}

interface PhotographyAdminProps {
  initialPhotos: Photo[];
  interactions: Interaction[];
  initialEnabled: string;
  initialTitle: string;
  initialDescription: string;
}

function getDeviceIcon(device: string) {
  const dev = device.toLowerCase();
  if (dev.includes("mobile") || dev.includes("phone")) {
    return <FiSmartphone className="w-3 h-3 text-zinc-500 flex-shrink-0" />;
  }
  if (dev.includes("tablet") || dev.includes("ipad")) {
    return <FiTablet className="w-3 h-3 text-zinc-500 flex-shrink-0" />;
  }
  return <FiMonitor className="w-3 h-3 text-zinc-500 flex-shrink-0" />;
}

function getBrowserIcon(browser: string) {
  const b = browser.toLowerCase();
  if (b.includes("instagram")) {
    return <FaInstagram className="w-3 h-3 text-pink-500 flex-shrink-0" />;
  }
  if (b.includes("linkedin")) {
    return <FaLinkedin className="w-3 h-3 text-blue-500 flex-shrink-0" style={{ color: "#0A66C2" }} />;
  }
  if (b.includes("facebook")) {
    return <FaFacebook className="w-3 h-3 text-blue-500 flex-shrink-0" />;
  }
  if (b.includes("twitter") || b.includes("x")) {
    return <FaTwitter className="w-3 h-3 text-sky-400 flex-shrink-0" />;
  }
  if (b.includes("chrome")) {
    return <FaChrome className="w-3 h-3 text-red-400 flex-shrink-0" />;
  }
  if (b.includes("safari")) {
    return <FaSafari className="w-3 h-3 text-blue-400 flex-shrink-0" />;
  }
  if (b.includes("firefox")) {
    return <FaFirefox className="w-3 h-3 text-orange-400 flex-shrink-0" />;
  }
  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function PhotographyAdmin({
  initialPhotos,
  interactions,
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

  // Tab state for the audit log
  const [logTab, setLogTab] = useState<"timeline" | "photos" | "users">("timeline");

  // Real-time progress states
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processingCount, setProcessingCount] = useState<number | null>(null);
  const [processedCount, setProcessedCount] = useState<number>(0);

  // drag state
  const dragIdx = useRef<number | null>(null);

  // Search, filter, and sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "like" | "download" | "share" | "referral">("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter list
  const filteredInteractions = interactions.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      item.photoTitle.toLowerCase().includes(term) ||
      item.visitorId.toLowerCase().includes(term) ||
      item.type.toLowerCase().includes(term) ||
      (item.geo?.city || "").toLowerCase().includes(term) ||
      (item.geo?.country || "").toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (filterType === "all") return true;
    if (filterType === "like") return item.type === "like";
    if (filterType === "download") return item.type === "download";
    if (filterType === "share") return item.type.startsWith("share_");
    if (filterType === "referral") return item.type.startsWith("ref_click:");
    return true;
  });

  // Sort list
  const sortedInteractions = [...filteredInteractions].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
  });

  // Reset page when filtering or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  // Grouped lists
  const interactionsByPhoto = Object.values(
    sortedInteractions.reduce((acc, curr) => {
      if (!acc[curr.photoId]) {
        acc[curr.photoId] = {
          photoId: curr.photoId,
          photoTitle: curr.photoTitle,
          photoImageUrl: curr.photoImageUrl,
          interactions: [],
        };
      }
      const group = acc[curr.photoId];
      if (group) {
        group.interactions.push(curr);
      }
      return acc;
    }, {} as Record<string, { photoId: string; photoTitle: string; photoImageUrl: string; interactions: typeof interactions }>)
  );

  const interactionsByVisitor = Object.values(
    sortedInteractions.reduce((acc, curr) => {
      if (!acc[curr.visitorId]) {
        acc[curr.visitorId] = {
          visitorId: curr.visitorId,
          geo: curr.geo,
          interactions: [],
        };
      }
      const group = acc[curr.visitorId];
      if (group) {
        group.interactions.push(curr);
      }
      return acc;
    }, {} as Record<string, { visitorId: string; geo: Interaction["geo"]; interactions: typeof interactions }>)
  );

  // Paginated flat feed
  const totalItems = sortedInteractions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedTimeline = sortedInteractions.slice(startIndex, startIndex + itemsPerPage);

  const getInteractionMeta = (type: string) => {
    let actionText = "";
    let actionColor = "text-zinc-400";
    let actionIcon = null;

    if (type === "like") {
      actionText = "Liked photograph";
      actionColor = "text-red-500";
      actionIcon = <FiHeart className="w-3 h-3 fill-current" />;
    } else if (type === "download") {
      actionText = "Downloaded photograph";
      actionColor = "text-[#10B981]";
      actionIcon = <FiDownload className="w-3 h-3" />;
    } else if (type.startsWith("share_")) {
      const platform = type.split("_")[1] || "unknown";
      actionText = `Shared to ${platform}`;
      actionColor = "text-amber-500";
      actionIcon = <FiShare2 className="w-3 h-3" />;
    } else if (type.startsWith("ref_click:")) {
      const referrerId = type.split(":")[1] || "";
      actionText = `Opened referral link (Ref: ${referrerId.substring(0, 8)})`;
      actionColor = "text-blue-400";
      actionIcon = <FiGlobe className="w-3 h-3" />;
    } else {
      actionText = `Interacted (${type})`;
      actionIcon = <FiTerminal className="w-3 h-3" />;
    }
    return { actionText, actionColor, actionIcon };
  };

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
      <section data-tour="photography-settings" className="mb-10 border border-[#262626] bg-[#0c0c0c] p-6">
        <h2 className="mb-6 font-syne text-sm font-bold text-white uppercase tracking-wider">Page Settings</h2>

        {/* Enabled toggle */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#262626] pb-4">
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider">Enable Photography Section</h3>
            <p className="text-[10px] text-zinc-550">Show or hide the photography link and page on your website.</p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-all self-start sm:self-auto rounded-none ${
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
          <label data-tour="photography-uploadzone" className="flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed border-[#262626] bg-[#0c0c0c] p-10 text-center transition hover:border-[#F59E0B]/40">
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
                    className="mb-1 font-mono text-[9px] text-zinc-500 uppercase tracking-wide"
                  >
                    {renderExifSummary(photo.exif_data)}
                  </div>

                  {/* Photo Engagement Analytics */}
                  <div className="flex gap-4 mb-3 font-mono text-[9px] text-zinc-400 uppercase tracking-wider items-center">
                    <span title="Likes" className="flex items-center gap-1"><FiHeart className="w-3 h-3 text-red-500 fill-current" /> {photo.likes ?? 0}</span>
                    <span title="Downloads" className="flex items-center gap-1"><FiDownload className="w-3 h-3 text-[#10B981]" /> {photo.downloads ?? 0}</span>
                    <span title="Shares" className="flex items-center gap-1"><FiShare2 className="w-3 h-3 text-amber-500" /> {photo.shares ?? 0}</span>
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

      {/* ── Photo Engagement & Referral Tracking Log ── */}
      <section className="mb-10 border border-[#262626] bg-[#0c0c0c] p-6 mt-10 font-mono">
        <div className="flex items-center gap-2 mb-6 border-b border-[#262626] pb-3 justify-between flex-wrap">
          <div className="flex items-center gap-2">
            <FiActivity className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="font-syne text-sm font-bold text-white uppercase tracking-wider">
              Engagement & Referral Log
            </h2>
          </div>

          {/* Tab Selector */}
          <div className="flex gap-3 mt-2 sm:mt-0">
            {(["timeline", "photos", "users"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setLogTab(tab)}
                className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 border transition-all ${
                  logTab === tab
                    ? "border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]"
                    : "border-[#262626] bg-black text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab === "timeline" ? "Feed" : tab === "photos" ? "By Photo" : "By Visitor"}
              </button>
            ))}
          </div>
        </div>

        {/* Controls Bar: Search, Type Filter, Sort Order */}
        {interactions.length > 0 && (
          <div className="grid gap-3 md:grid-cols-4 mb-6 bg-black/40 border border-[#262626]/60 p-4 text-xs">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-zinc-500 w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search photo, visitor, city, country, or action..."
                className="w-full pl-9 pr-4 py-2 border border-[#262626] bg-black text-zinc-300 placeholder-zinc-650 outline-none focus:border-[#F59E0B]/50 font-mono text-[11px] rounded-none"
              />
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3 py-2 border border-[#262626] bg-black text-zinc-300 outline-none focus:border-[#F59E0B]/50 font-mono text-[11px] rounded-none"
              >
                <option value="all">All Events</option>
                <option value="like">Likes</option>
                <option value="download">Downloads</option>
                <option value="share">Shares</option>
                <option value="referral">Referrals</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full px-3 py-2 border border-[#262626] bg-black text-zinc-300 outline-none focus:border-[#F59E0B]/50 font-mono text-[11px] rounded-none"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        )}

        {sortedInteractions.length === 0 ? (
          <p className="text-zinc-650 font-mono text-xs italic">No matching interactions found.</p>
        ) : (
          <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar space-y-6">
            {/* 1. Flat Timeline Feed */}
            {logTab === "timeline" && (
              <div className="space-y-4">
                {paginatedTimeline.map((item) => {
                  const { actionText, actionColor, actionIcon } = getInteractionMeta(item.type);
                  const formattedTime = new Date(item.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div key={item.id} className="flex gap-4 items-start border-b border-[#262626]/40 pb-3 last:border-0 last:pb-0">
                      <div className="relative w-11 h-11 bg-zinc-900 border border-[#262626] shrink-0">
                        <Image
                          src={item.photoImageUrl}
                          alt={item.photoTitle}
                          fill
                          sizes="44px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`flex items-center gap-1 font-bold uppercase tracking-wide text-[9px] ${actionColor}`}>
                            {actionIcon}
                            {actionText}
                          </span>
                          <span className="text-[9px] text-zinc-500">· {formattedTime}</span>
                        </div>

                        <div className="text-[11px] text-zinc-300 font-syne font-bold uppercase tracking-tight mt-1 truncate">
                          {item.photoTitle}
                        </div>

                        <div className="flex gap-3 items-center text-[9px] text-zinc-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-0.5">
                            <FiUser className="w-2.5 h-2.5" />
                            {item.visitorId.substring(0, 10)}...
                          </span>
                          {item.geo && (
                            <>
                              <span className="flex items-center gap-0.5">
                                <FiMapPin className="w-2.5 h-2.5 text-[#10B981]" />
                                {item.geo.city}, {item.geo.country}
                              </span>
                              <span className="flex items-center gap-1.5 capitalize text-zinc-650">
                                {getDeviceIcon(item.geo.device)}
                                {getBrowserIcon(item.geo.browser)}
                                <span>{item.geo.device} ({item.geo.browser})</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-[#262626]/40 pt-4 mt-6">
                    <button
                      type="button"
                      disabled={activePage === 1}
                      onClick={() => setCurrentPage(activePage - 1)}
                      className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 border border-[#262626] bg-black text-zinc-400 hover:border-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:border-[#262626] disabled:hover:text-zinc-400 transition-colors"
                    >
                      <FiChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Page {activePage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={activePage === totalPages}
                      onClick={() => setCurrentPage(activePage + 1)}
                      className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 border border-[#262626] bg-black text-zinc-400 hover:border-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:border-[#262626] disabled:hover:text-zinc-400 transition-colors"
                    >
                      Next <FiChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. Grouped By Photo */}
            {logTab === "photos" && (
              <div className="space-y-6">
                {interactionsByPhoto.map((group) => (
                  <div key={group.photoId} className="border border-[#262626] bg-black/40 p-4">
                    <div className="flex gap-3 items-center border-b border-[#262626] pb-3 mb-3">
                      <div className="relative w-12 h-12 bg-zinc-900 border border-[#262626] shrink-0">
                        <Image
                          src={group.photoImageUrl}
                          alt={group.photoTitle}
                          fill
                          sizes="48px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-syne font-bold text-white text-xs uppercase tracking-tight truncate">
                          {group.photoTitle}
                        </h3>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">
                          Total Interactions: {group.interactions.length}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pl-2 border-l border-[#262626]">
                      {group.interactions.map((event) => {
                        const { actionText, actionColor, actionIcon } = getInteractionMeta(event.type);
                        const formattedTime = new Date(event.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <div key={event.id} className="text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`flex items-center gap-1 font-bold uppercase tracking-wide text-[9px] ${actionColor}`}>
                                {actionIcon}
                                {actionText}
                              </span>
                              <span className="text-[9px] text-zinc-500">· {formattedTime}</span>
                            </div>
                            <div className="flex gap-3 items-center text-[9px] text-zinc-500 mt-0.5 flex-wrap">
                              <span className="flex items-center gap-0.5">
                                <FiUser className="w-2.5 h-2.5" />
                                {event.visitorId.substring(0, 10)}...
                              </span>
                              {event.geo && (
                                <>
                                  <span className="flex items-center gap-0.5">
                                    <FiMapPin className="w-2.5 h-2.5 text-[#10B981]" />
                                    {event.geo.city}, {event.geo.country}
                                  </span>
                                  <span className="flex items-center gap-1.5 capitalize text-zinc-650">
                                    {getDeviceIcon(event.geo.device)}
                                    {getBrowserIcon(event.geo.browser)}
                                    <span>{event.geo.device} ({event.geo.browser})</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Grouped By Visitor */}
            {logTab === "users" && (
              <div className="space-y-6">
                {interactionsByVisitor.map((group) => {
                  const locationString = group.geo 
                    ? `${group.geo.city}, ${group.geo.country}` 
                    : "Unknown Location";
                  const browserString = group.geo
                    ? `${group.geo.device} (${group.geo.browser})`
                    : "";

                  return (
                    <div key={group.visitorId} className="border border-[#262626] bg-black/40 p-4">
                      <div className="border-b border-[#262626] pb-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap text-white font-bold text-xs uppercase tracking-tight font-syne">
                          <FiUser className="w-3.5 h-3.5 text-[#F59E0B]" />
                          <span>Visitor: {group.visitorId.substring(0, 12)}...</span>
                        </div>
                        <div className="flex gap-3 items-center text-[9px] text-zinc-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-0.5">
                            <FiMapPin className="w-2.5 h-2.5 text-[#10B981]" />
                            {locationString}
                          </span>
                          {group.geo && (
                            <span className="flex items-center gap-1.5 capitalize">
                              {getDeviceIcon(group.geo.device)}
                              {getBrowserIcon(group.geo.browser)}
                              <span>{browserString}</span>
                            </span>
                          )}
                          <span>· {group.interactions.length} Events</span>
                        </div>
                      </div>

                      <div className="space-y-3.5 pl-2 border-l border-[#262626]">
                        {group.interactions.map((event) => {
                          const { actionText, actionColor, actionIcon } = getInteractionMeta(event.type);
                          const formattedTime = new Date(event.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          });

                          return (
                            <div key={event.id} className="flex gap-3 items-start text-xs">
                              {/* Photo thumbnail */}
                              <div className="relative w-8 h-8 bg-zinc-900 border border-[#262626] shrink-0 mt-0.5">
                                <Image
                                  src={event.photoImageUrl}
                                  alt={event.photoTitle}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`flex items-center gap-1 font-bold uppercase tracking-wide text-[9px] ${actionColor}`}>
                                    {actionIcon}
                                    {actionText}
                                  </span>
                                  <span className="text-[9px] text-zinc-500">· {formattedTime}</span>
                                </div>
                                <div className="text-[10px] text-zinc-300 font-syne font-bold uppercase tracking-tight mt-0.5 truncate">
                                  {event.photoTitle}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

      <CelebrationPopover type="photo" count={photos.length} />
    </div>
  );
}
