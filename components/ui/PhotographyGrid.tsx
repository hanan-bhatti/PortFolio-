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
import { cn } from "@/lib/utils";

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

interface GridParticle {
  id: number;
  tx: number;
  ty: number;
  rot: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
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
  const [heartAnim, setHeartAnim] = useState<{ [photoId: string]: { key: number; visible: boolean } }>({});
  const [particles, setParticles] = useState<{ [photoId: string]: GridParticle[] }>({});
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
      // Trigger browser download via our server proxy GET route
      const downloadUrl = `/api/photography/${photo.id}/download?visitorId=${encodeURIComponent(visitorId)}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Increment count locally
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, downloads: p.downloads + 1 } : p))
      );
    } catch (err) {
      console.error("Failed to initiate proxy download:", err);
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
        const current = prev[photoId] || { key: 0, visible: false };
        return {
          ...prev,
          [photoId]: { key: current.key + 1, visible: true },
        };
      });

      // Burst particles
      const colors = ["#FF2D55", "#FF375F", "#FF453A", "#FF9F0A", "#FFD60A", "#FFFFFF", "#FF85A2", "#FF5E7E"];
      const newParticles = Array.from({ length: 16 }).map((_, i) => {
        const angle = Math.random() * 360;
        const distance = Math.random() * 70 + 50; // 50px to 120px spread (slightly smaller for grid cards)
        const tx = Math.cos((angle * Math.PI) / 180) * distance;
        const ty = Math.sin((angle * Math.PI) / 180) * distance;
        const rot = Math.random() * 360 - 180;
        const size = Math.random() * 6 + 5; // 5px to 11px tiny cute hearts
        const color = colors[Math.floor(Math.random() * colors.length)] || "#FF2D55";
        const delay = Math.random() * 0.12; // staggered wave
        const duration = Math.random() * 0.4 + 0.5; // 0.5s to 0.9s

        return {
          id: Date.now() + i,
          tx,
          ty,
          rot,
          size,
          color,
          delay,
          duration,
        };
      });
      setParticles((p) => ({ ...p, [photoId]: newParticles }));
      setTimeout(() => {
        setParticles((p) => ({ ...p, [photoId]: [] }));
      }, 1200);

      if (heartTimeoutRef.current[photoId]) clearTimeout(heartTimeoutRef.current[photoId]);
      heartTimeoutRef.current[photoId] = setTimeout(() => {
        setHeartAnim((prev) => ({
          ...prev,
          [photoId]: { key: prev[photoId]?.key || 0, visible: false },
        }));
      }, 800);
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
      <div className="columns-2 md:columns-3 gap-[8px] [column-fill:_balance] space-y-[8px] w-full relative z-10">
        {photos.map((photo, index) => {
          const anim = heartAnim[photo.id] || { key: 0, visible: false };
          const pList = particles[photo.id] || [];

          return (
            <div
              key={photo.id}
              onClick={() => handleCardClick(photo.id, index)}
              className="break-inside-avoid-column group relative overflow-hidden border border-white/10 bg-[#0c0c0c] cursor-pointer transition-all duration-300 hover:border-amber-500/40 hover:scale-[1.01] flex flex-col select-none mb-[8px]"
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
                    key={anim.key}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-instagram-heart"
                  >
                    <svg
                      className="w-16 h-16 text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] fill-current"
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
                    className="absolute pointer-events-none z-35 animate-particle-rich"
                    style={{
                      left: "50%",
                      top: "50%",
                      "--tx": `${p.tx}px`,
                      "--ty": `${p.ty}px`,
                      "--rot": `${p.rot}deg`,
                      "--delay": `${p.delay}s`,
                      "--duration": `${p.duration}s`,
                      width: `${p.size}px`,
                      height: `${p.size}px`,
                    } as React.CSSProperties}
                  >
                    <svg 
                      viewBox="0 0 24 24" 
                      className="w-full h-full fill-current"
                      style={{ color: p.color }}
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                ))}
              </div>

              {/* Minimalist Card details footer body underneath the photo card */}
              <div className="p-3 border-t border-white/5 bg-[#080808]/90 flex items-center justify-between font-mono text-[10px]">
                {photo.title ? (
                  <h3 className="font-syne text-xs font-bold text-white uppercase tracking-tight line-clamp-1 pr-4 w-full text-left">
                    {photo.title}
                  </h3>
                ) : (
                  <span className="text-zinc-650 italic">Untitled</span>
                )}
                <span className="text-amber-500 font-bold shrink-0">
                  #{String(index + 1).padStart(2, "0")}
                </span>
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
      {/* Scoped CSS for springy Instagram double-click heart animations */}
      <style>{`
        @keyframes instagram-heart-pop {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          15% {
            opacity: 0.9;
            transform: scale(1.2);
          }
          30% {
            opacity: 0.9;
            transform: scale(0.9);
          }
          45% {
            opacity: 0.9;
            transform: scale(1.0);
          }
          80% {
            opacity: 0.9;
            transform: scale(1.0);
          }
          100% {
            opacity: 0;
            transform: scale(0);
          }
        }

        .animate-instagram-heart {
          animation: instagram-heart-pop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes particle-burst-out {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(0) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translate(-50%, -50%) translate(calc(var(--tx) * 0.2), calc(var(--ty) * 0.2)) scale(1.1) rotate(calc(var(--rot) * 0.2));
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(0) rotate(var(--rot));
            opacity: 0;
          }
        }
        .animate-particle-rich {
          animation: particle-burst-out var(--duration) cubic-bezier(0.15, 0.85, 0.3, 1) var(--delay) forwards;
        }
      `}</style>
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
