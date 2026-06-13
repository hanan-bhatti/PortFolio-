"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";

const formatShutter = (n: number) => {
  if (n >= 1) return `${n}s`;
  return `1/${Math.round(1 / n)}s`;
};

const formatFNumber = (n: number) => `f/${n}`;

const formatFocal = (n: number) => `${Math.round(n)}mm`;

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

type ExifData = {
  make?: string | null;
  model?: string | null;
  fNumber?: number | null;
  exposureTime?: number | null;
  iso?: number | null;
  focalLength?: number | null;
  dateTimeOriginal?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
};

interface Photo {
  id: string;
  imageUrl: string;
  title: string | null;
  description: string | null;
  exif_data?: ExifData | null;
}

interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoLightbox({ photos, initialIndex, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMounted, setIsMounted] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      touchStartX.current = touch.clientX;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const diffX = touch.clientX - touchStartX.current;
    if (diffX > 50) {
      handlePrev();
    } else if (diffX < -50) {
      handleNext();
    }
    touchStartX.current = null;
  };

  if (!isMounted || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  if (!currentPhoto) return null;

  const exif = currentPhoto.exif_data;
  const hasExif = !!(
    exif &&
    (exif.make ||
      exif.model ||
      exif.fNumber ||
      exif.exposureTime ||
      exif.iso ||
      exif.focalLength ||
      exif.locationName ||
      exif.dateTimeOriginal)
  );

  interface ExifItem {
    label: string;
    value: React.ReactNode;
  }

  const exifItems: ExifItem[] = [];
  if (exif) {
    if (exif.make || exif.model) {
      exifItems.push({
        label: "DEVICE",
        value: [exif.make, exif.model].filter(Boolean).join(" "),
      });
    }
    if (exif.fNumber !== undefined && exif.fNumber !== null) {
      exifItems.push({
        label: "APERTURE",
        value: formatFNumber(exif.fNumber),
      });
    }
    if (exif.exposureTime !== undefined && exif.exposureTime !== null) {
      exifItems.push({
        label: "SHUTTER",
        value: formatShutter(exif.exposureTime),
      });
    }
    if (exif.iso !== undefined && exif.iso !== null) {
      exifItems.push({
        label: "ISO",
        value: exif.iso.toString(),
      });
    }
    if (exif.focalLength !== undefined && exif.focalLength !== null) {
      exifItems.push({
        label: "FOCAL",
        value: formatFocal(exif.focalLength),
      });
    }
    if (exif.locationName) {
      exifItems.push({
        label: "LOCATION",
        value: (
          <span className="flex items-center gap-1">
            <span style={{ color: "var(--green)" }}>📍</span> {exif.locationName}
          </span>
        ),
      });
    }
    if (exif.dateTimeOriginal) {
      exifItems.push({
        label: "DATE",
        value: formatDate(exif.dateTimeOriginal),
      });
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 transition-opacity duration-300"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onClose}
    >
      {/* Top bar with Close button */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 z-10 pointer-events-none">
        <div className="text-xs uppercase tracking-widest text-zinc-500 font-inter">
          {currentIndex + 1} / {photos.length}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center border border-white/10 bg-white/5 text-white transition hover:bg-white/10 hover:border-white/20 active:scale-95"
          aria-label="Close lightbox"
          style={{ borderRadius: "0px" }}
        >
          <span className="text-xl font-light">×</span>
        </button>
      </div>

      {/* Main Image Container */}
      <div
        className="relative flex flex-col items-center justify-center w-full max-w-4xl px-4 md:px-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center select-none">
          <Image
            src={currentPhoto.imageUrl}
            alt={currentPhoto.title ?? "Photo"}
            fill
            className="object-contain transition-all duration-300"
            sizes="(max-width: 768px) 100vw, 80vw"
            priority
            unoptimized
          />
        </div>

        {/* Info panel below the image */}
        {currentPhoto.title && (
          <h3 className="mt-4 text-center font-syne text-lg font-bold text-white tracking-tight">
            {currentPhoto.title}
          </h3>
        )}

        {currentPhoto.description && (
          <p
            className="text-center font-inter text-[13px] leading-relaxed text-white/50 italic"
            style={{
              maxWidth: "600px",
              margin: "0.75rem auto 0",
              fontWeight: 400,
            }}
          >
            {currentPhoto.description}
          </p>
        )}

        {hasExif && exifItems.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: "1rem",
              padding: "0.75rem 1rem",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {exifItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.3)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Left Navigation Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center border border-white/10 bg-black/40 text-white transition hover:bg-white/10 hover:border-white/20 active:scale-95 z-10"
        aria-label="Previous photo"
        style={{ borderRadius: "0px" }}
      >
        <span className="text-lg">←</span>
      </button>

      {/* Right Navigation Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center border border-white/10 bg-black/40 text-white transition hover:bg-white/10 hover:border-white/20 active:scale-95 z-10"
        aria-label="Next photo"
        style={{ borderRadius: "0px" }}
      >
        <span className="text-lg">→</span>
      </button>
    </div>
  );
}
