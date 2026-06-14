"use client";

import { useState } from "react";
import Image from "next/image";
import PhotoLightbox from "./PhotoLightbox";

interface Photo {
  id: string;
  imageUrl: string;
  title: string | null;
  description: string | null;
  exif_data?: any;
}

interface PhotographyGridProps {
  photos: Photo[];
}

export default function PhotographyGrid({ photos }: PhotographyGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
              {/* Aspect-ratio spacer or natural aspect ratio. Since it's columns masonry, we can render the image using a standard img tag or Next.js Image with layout/styling */}
              {/* To make it work with CSS columns and preserve aspect ratios perfectly, we can use a standard img tag or standard CSS. Let's use standard HTML img with Next.js styling or Image component with appropriate heights. */}
              {/* A standard <img> tag is optimal for pure CSS masonry columns because it automatically scales the height proportionally based on the source image, making column layouts perfect without predefined heights! */}
              {/* Let's use a standard img tag with tailwind and lazy loading! */}
              <img
                src={
                  process.env.NODE_ENV !== "development" &&
                  (photo.imageUrl.startsWith("http") || (photo.imageUrl.startsWith("/") && !photo.imageUrl.startsWith("/_next")))
                    ? `/_next/image?url=${encodeURIComponent(photo.imageUrl)}&w=640&q=75`
                    : photo.imageUrl
                }
                alt={photo.title ?? "Photograph"}
                loading="lazy"
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/50 flex flex-col justify-end p-5 opacity-0 group-hover:opacity-100">
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
