"use client";

/**
 * @file components/ui/PhotographyGrid.tsx
 * @description React component for PhotographyGrid.tsx under the ui category.
 * 
 * @exports
 * - PhotographyGrid (default): Main React component or function
 */

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { FiHeart, FiDownload, FiShare2 } from "react-icons/fi";
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

function GridContent({ photos }: PhotographyGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const searchParams = useSearchParams();

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
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => setActiveIndex(index)}
            className="break-inside-avoid-column group relative overflow-hidden border border-white/10 bg-white/[0.02] cursor-pointer transition-all duration-300 hover:border-amber-500/40 hover:scale-[1.01] flex flex-col"
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
              
              {/* Overlay: always visible on mobile, hover-triggered on desktop */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent md:bg-black/0 md:transition-colors md:duration-300 md:group-hover:bg-black/70 flex flex-col justify-end p-5 opacity-100 md:opacity-0 md:transition-opacity md:duration-300 md:group-hover:opacity-100">
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

                {/* Counts Bar */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10 font-inter text-xs text-white/70">
                  <span className="flex items-center gap-1.5 hover:text-red-400 transition-colors">
                    <FiHeart className="w-3.5 h-3.5 fill-current" />
                    {photo.likes ?? 0}
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-green transition-colors">
                    <FiDownload className="w-3.5 h-3.5" />
                    {photo.downloads ?? 0}
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-amber-500 transition-colors">
                    <FiShare2 className="w-3.5 h-3.5" />
                    {photo.shares ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
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
