"use client";

/**
 * @file components/ui/PhotographyGrid.tsx
 * @description React component for PhotographyGrid.tsx under the ui category.
 * 
 * @exports
 * - PhotographyGrid (default): Main React component or function
 */

import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { FiHeart, FiDownload, FiShare2 } from "react-icons/fi";
import { toast } from "sonner";
import PhotoLightbox from "./PhotoLightbox";
import { getVisitorId } from "@/lib/analytics";

interface Photo {
  id: string;
  imageUrl: string;
  title: string | null;
  description: string | null;
  exif_data?: any;
  likes: number;
  downloads: number;
  shares: number;
  isLiked: boolean;
}

interface PhotographyGridProps {
  photos: Photo[];
}

function GridContent({ photos: initialPhotos }: PhotographyGridProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const searchParams = useSearchParams();

  // Keep state in sync with initialPhotos prop updates (e.g. if parent component refetches)
  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  // Double click heart and burst animation states
  const [heartAnim, setHeartAnim] = useState<{ [photoId: string]: { scale: number; visible: boolean } }>({});
  const [particles, setParticles] = useState<{ [photoId: string]: { id: number; angle: number; scale: number }[] }>({});
  const lastTapRef = useRef<{ [photoId: string]: number }>({});
  const heartTimeoutRef = useRef<{ [photoId: string]: NodeJS.Timeout }>({});

  // Listen for ?photo=ID query parameter to auto-open lightbox and track referrals
  useEffect(() => {
    const photoId = searchParams.get("photo");
    const referrerId = searchParams.get("ref");
    if (photoId) {
      const idx = photos.findIndex((p) => p.id === photoId);
      if (idx !== -1) {
        setActiveIndex(idx);
      }
      
      // If opened via share link, track the referral click
      if (referrerId) {
        const visitorId = getVisitorId() || "anonymous";
        fetch(`/api/photography/${photoId}/share-click`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId, referrerId }),
        }).catch((err) => console.error("Referral track fail:", err));
      }
    }
  }, [searchParams, photos]);

  // Handle direct clicks on overlay actions
  const handleLikeDirect = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    const visitorId = getVisitorId() || "anonymous";
    const photo = photos.find((p) => p.id === photoId);
    if (!photo) return;

    const nextLiked = !photo.isLiked;
    // Visually toggle immediately
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId
          ? {
              ...p,
              isLiked: nextLiked,
              likes: Math.max(0, p.likes + (nextLiked ? 1 : -1)),
            }
          : p
      )
    );

    try {
      const res = await fetch(`/api/photography/${photoId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      });
      if (res.ok) {
        const data = await res.json();
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId ? { ...p, likes: data.likes, isLiked: data.liked } : p
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadDirect = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    const photo = photos.find((p) => p.id === photoId);
    if (!photo) return;
    const visitorId = getVisitorId() || "anonymous";

    try {
      // Fetch the image as a blob
      try {
        const response = await fetch(photo.imageUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = photo.title
          ? `${photo.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`
          : `photo-${photo.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (corsErr) {
        console.warn("Direct blob download failed, falling back to new tab:", corsErr);
        const link = document.createElement("a");
        link.href = photo.imageUrl;
        link.download = photo.title || `photo-${photo.id}`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Increment count locally
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, downloads: p.downloads + 1 } : p))
      );

      await fetch(`/api/photography/${photoId}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareDirect = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    const visitorId = getVisitorId() || "anonymous";
    const shareUrl = `${window.location.origin}/photography?photo=${photoId}&ref=${visitorId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Referral link copied to clipboard!");
    } catch (err) {
      console.error("Copy failed:", err);
      // Fallback manual copying
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      toast.success("Referral link copied to clipboard!");
    }

    // Increment count locally
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, shares: p.shares + 1 } : p))
    );

    try {
      await fetch(`/api/photography/${photoId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, platform: "copy" }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Handle direct Double tap / Double click directly on the grid card
  const handleCardClick = (photoId: string, index: number) => {
    const now = Date.now();
    const DOUBLE_CLICK_DELAY = 300;
    const lastTap = lastTapRef.current[photoId] || 0;

    if (now - lastTap < DOUBLE_CLICK_DELAY) {
      const photo = photos.find((p) => p.id === photoId);
      if (photo && !photo.isLiked) {
        // Trigger direct like
        const visitorId = getVisitorId() || "anonymous";
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId ? { ...p, isLiked: true, likes: p.likes + 1 } : p
          )
        );
        fetch(`/api/photography/${photoId}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId }),
        }).catch(console.error);
      }

      // Trigger heart anim
      setHeartAnim((prev) => {
        const current = prev[photoId] || { scale: 1.0, visible: false };
        const nextScale = current.scale >= 2.2 ? 1.0 : current.scale + 0.3;
        
        if (nextScale >= 2.2) {
          // Burst
          const newParticles = Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 360) / 12 + (Math.random() * 15 - 7.5);
            return {
              id: Date.now() + i,
              scale: Math.random() * 0.4 + 0.4,
              angle,
            };
          });
          setParticles((p) => ({ ...p, [photoId]: newParticles }));
          setTimeout(() => {
            setParticles((p) => ({ ...p, [photoId]: [] }));
          }, 1000);
          return { ...prev, [photoId]: { scale: 1.0, visible: true } };
        }
        return { ...prev, [photoId]: { scale: nextScale, visible: true } };
      });

      if (heartTimeoutRef.current[photoId]) clearTimeout(heartTimeoutRef.current[photoId]);
      heartTimeoutRef.current[photoId] = setTimeout(() => {
        setHeartAnim((prev) => ({
          ...prev,
          [photoId]: { scale: 1.0, visible: false },
        }));
      }, 950);
    } else {
      // Single click: open lightbox with a delay to allow detecting double click
      const singleClickTimeout = setTimeout(() => {
        const doubleClickThreshold = lastTapRef.current[photoId] || 0;
        if (Date.now() - doubleClickThreshold >= DOUBLE_CLICK_DELAY) {
          setActiveIndex(index);
        }
      }, DOUBLE_CLICK_DELAY);
    }
    lastTapRef.current[photoId] = now;
  };

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-inter text-zinc-600 text-sm">No photos displayed at the moment.</p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-2 lg:columns-3 gap-4 md:gap-6 [column-fill:_balance] space-y-4 md:space-y-6 w-full relative z-10">
        {photos.map((photo, index) => {
          const isLkd = photo.isLiked;
          const anim = heartAnim[photo.id] || { scale: 1.0, visible: false };
          const pList = particles[photo.id] || [];

          return (
            <div
              key={photo.id}
              onClick={() => handleCardClick(photo.id, index)}
              className="break-inside-avoid-column group relative overflow-hidden border border-white/10 bg-white/[0.02] cursor-pointer transition-all duration-300 hover:border-amber-500/40 hover:scale-[1.01] flex flex-col select-none"
              style={{ borderRadius: "0px" }}
            >
              {/* Image Wrapper */}
              <div className="relative w-full overflow-hidden bg-zinc-900/50">
                <Image
                  src={photo.imageUrl}
                  alt={photo.title ?? "Photograph"}
                  width={640}
                  height={480}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                  priority={index < 3}
                />

                {/* Double click scaling heart overlay */}
                {anim.visible && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                    style={{
                      transform: `scale(${anim.scale})`,
                      transition: "transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    }}
                  >
                    <svg
                      className="w-20 h-20 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.7)] fill-current animate-heart-pop"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                )}

                {/* Burst particles */}
                {pList.map((p) => (
                  <div
                    key={p.id}
                    className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-red-500 pointer-events-none z-35 animate-particle-fade"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${p.angle}deg) translate(80px) scale(${p.scale})`,
                      transition: "transform 1s cubic-bezier(0.1, 0.8, 0.25, 1), opacity 1s",
                    }}
                  />
                ))}
                
                {/* Overlay: always visible on mobile, hover-triggered on desktop */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent md:bg-black/0 md:transition-colors md:duration-300 md:group-hover:bg-black/70 flex flex-col justify-end p-5 opacity-100 md:opacity-0 md:transition-opacity md:duration-300 md:group-hover:opacity-100 z-20">
                  <span className="font-syne text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">
                    #{String(index + 1).padStart(2, "0")}
                  </span>
                  {photo.title && (
                    <h3 className="font-syne text-sm font-bold text-white uppercase tracking-tight">
                      {photo.title}
                    </h3>
                  )}
                  {photo.description && (
                    <p className="font-inter text-[11px] text-zinc-400 mt-1 line-clamp-2 italic">
                      {photo.description}
                    </p>
                  )}

                  {/* Counts / Interactions Bar */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10 font-inter text-xs text-white/70">
                    <button
                      onClick={(e) => handleLikeDirect(e, photo.id)}
                      className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isLkd ? "text-red-500 font-bold" : "hover:text-red-400"
                      }`}
                      title={isLkd ? "Unlike" : "Like"}
                    >
                      <FiHeart className={`w-3.5 h-3.5 ${isLkd ? "fill-current" : ""}`} />
                      {photo.likes ?? 0}
                    </button>
                    
                    <button
                      onClick={(e) => handleDownloadDirect(e, photo.id)}
                      className="flex items-center gap-1.5 hover:text-[#10B981] transition-colors cursor-pointer"
                      title="Download photograph"
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                      {photo.downloads ?? 0}
                    </button>
                    
                    <button
                      onClick={(e) => handleShareDirect(e, photo.id)}
                      className="flex items-center gap-1.5 hover:text-amber-500 transition-colors cursor-pointer"
                      title="Copy referral link to share"
                    >
                      <FiShare2 className="w-3.5 h-3.5" />
                      {photo.shares ?? 0}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </>
  );
}

export default function PhotographyGrid(props: PhotographyGridProps) {
  return (
    <Suspense fallback={<div className="text-center py-20 text-zinc-500">Loading grid...</div>}>
      <GridContent {...props} />
    </Suspense>
  );
}
