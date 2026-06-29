"use client";

/**
 * @file components/ui/PhotoLightbox.tsx
 * @description React component for PhotoLightbox.tsx under the ui category.
 * 
 * @exports
 * - PhotoLightbox (default): Main React component or function
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { FiHeart, FiDownload, FiShare2, FiCopy, FiX, FiCamera, FiClock, FiLayers, FiMaximize, FiCalendar, FiSliders } from "react-icons/fi";
import { FaLinkedinIn, FaWhatsapp, FaTwitter, FaInstagram } from "react-icons/fa";
import { getVisitorId } from "@/lib/analytics";

const getExifIcon = (label: string) => {
  switch (label.toLowerCase()) {
    case "device":
      return <FiCamera className="w-3.5 h-3.5 text-amber-500" />;
    case "aperture":
      return <FiSliders className="w-3.5 h-3.5 text-amber-500" />;
    case "shutter":
      return <FiClock className="w-3.5 h-3.5 text-amber-500" />;
    case "iso":
      return <FiLayers className="w-3.5 h-3.5 text-amber-500" />;
    case "focal":
      return <FiMaximize className="w-3.5 h-3.5 text-amber-500" />;
    case "date":
      return <FiCalendar className="w-3.5 h-3.5 text-amber-500" />;
    default:
      return null;
  }
};

interface Particle {
  id: number;
  tx: number;
  ty: number;
  rot: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
}

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
  likes: number;
  downloads: number;
  shares: number;
  isLiked: boolean;
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

  // Interaction States
  const currentPhoto = photos[currentIndex];
  const [likes, setLikes] = useState(currentPhoto?.likes || 0);
  const [downloads, setDownloads] = useState(currentPhoto?.downloads || 0);
  const [shares, setShares] = useState(currentPhoto?.shares || 0);
  const [isLiked, setIsLiked] = useState(currentPhoto?.isLiked || false);
  
  // Animation/Modal States
  const [showHeart, setShowHeart] = useState(false);
  const [heartKey, setHeartKey] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [canShareNative, setCanShareNative] = useState(false);
  
  const lastTapRef = useRef<number>(0);
  const heartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined" && typeof navigator.share === "function") {
      setCanShareNative(true);
    }
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Sync state with current photo
  useEffect(() => {
    setIsImageLoading(true);
    setImageError(false);
    setRetryKey(0);
    if (currentPhoto) {
      setLikes(currentPhoto.likes || 0);
      setDownloads(currentPhoto.downloads || 0);
      setShares(currentPhoto.shares || 0);
      setIsLiked(currentPhoto.isLiked || false);
    }
  }, [currentIndex, currentPhoto]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  // Handle Like Action
  const handleLike = useCallback(async () => {
    if (!currentPhoto) return;
    const visitorId = getVisitorId() || "anonymous";

    // Toggle visually immediately
    setIsLiked((prev) => {
      const nextLiked = !prev;
      setLikes((current) => Math.max(0, current + (nextLiked ? 1 : -1)));
      return nextLiked;
    });

    try {
      const res = await fetch(`/api/photography/${currentPhoto.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      });
      if (res.ok) {
        const data = await res.json();
        setLikes(data.likes);
        
        // Also update parent state
        currentPhoto.likes = data.likes;
        currentPhoto.isLiked = data.liked;
      }
    } catch (err) {
      console.error(err);
    }
  }, [currentPhoto]);

  const triggerBurst = useCallback(() => {
    const colors = ["#FF2D55", "#FF375F", "#FF453A", "#FF9F0A", "#FFD60A", "#FFFFFF", "#FF85A2", "#FF5E7E"];
    const newParticles: Particle[] = Array.from({ length: 16 }).map((_, i) => {
      const angle = Math.random() * 360;
      const distance = Math.random() * 80 + 60; // 60px to 140px spread
      const tx = Math.cos((angle * Math.PI) / 180) * distance;
      const ty = Math.sin((angle * Math.PI) / 180) * distance;
      const rot = Math.random() * 360 - 180;
      const size = Math.random() * 8 + 6; // 6px to 14px tiny cute hearts
      const color = colors[Math.floor(Math.random() * colors.length)] || "#FF2D55";
      const delay = Math.random() * 0.15; // staggered wave
      const duration = Math.random() * 0.4 + 0.6; // 0.6s to 1.0s

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
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1500);
  }, []);

  // Handle Double click with scaling and burst
  const handleImageClick = () => {
    const now = Date.now();
    const DOUBLE_CLICK_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_CLICK_DELAY) {
      if (!isLiked) {
        handleLike();
      }
      
      setHeartKey((prev) => prev + 1);
      setShowHeart(true);
      triggerBurst();

      if (heartTimeoutRef.current) clearTimeout(heartTimeoutRef.current);
      heartTimeoutRef.current = setTimeout(() => {
        setShowHeart(false);
      }, 800);
    }
    lastTapRef.current = now;
  };

  // Handle Download Action
  // Handle Download Action
  const handleDownload = async () => {
    if (!currentPhoto) return;
    const visitorId = getVisitorId() || "anonymous";

    try {
      // Trigger browser download via our server proxy GET route
      const downloadUrl = `/api/photography/${currentPhoto.id}/download?visitorId=${encodeURIComponent(visitorId)}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Increment count locally
      setDownloads((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to initiate proxy download:", err);
    }
  };

  // Handle Share Tracking
  const trackShare = async (platform: string) => {
    if (!currentPhoto) return;
    const visitorId = getVisitorId() || "anonymous";
    try {
      setShares((prev) => prev + 1);
      await fetch(`/api/photography/${currentPhoto.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, platform }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Handle native file + text share
  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPhoto) return;
    const visitorId = getVisitorId() || "anonymous";

    try {
      // Fetch the image file using our same-origin server proxy to prevent CORS blocking
      const response = await fetch(`/api/photography/${currentPhoto.id}/download?visitorId=${encodeURIComponent(visitorId)}`);
      const blob = await response.blob();
      
      const contentType = response.headers.get("Content-Type") || "image/jpeg";
      const fileExt = contentType.split("/")[1] || "jpg";
      const filename = `${(currentPhoto.title || "photo").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${fileExt}`;
      const file = new File([blob], filename, { type: contentType });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: currentPhoto.title || "Photograph",
          text: `Check out this photograph: ${shareLink}`,
        });
        trackShare("native-file-share");
        setShowShareModal(false);
      } else {
        await navigator.share({
          title: currentPhoto.title || "Photograph",
          text: `Check out this photograph: ${shareLink}`,
          url: shareLink
        });
        trackShare("native-text-share");
        setShowShareModal(false);
      }
    } catch (err) {
      console.warn("Native file sharing failed, attempting text-only share:", err);
      try {
        await navigator.share({
          title: currentPhoto.title || "Photograph",
          text: `Check out this photograph: ${shareLink}`,
          url: shareLink
        });
        trackShare("native-fallback-share");
        setShowShareModal(false);
      } catch (fallbackErr) {
        console.error("Native share sheet failed completely:", fallbackErr);
      }
    }
  };

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
  if (!currentPhoto) return null;

  // Generate dynamic share link
  const originUrl = typeof window !== "undefined" ? window.location.origin : "";
  const visitorId = getVisitorId() || "";
  const shareLink = `${originUrl}/s/p/${currentPhoto.id}${visitorId ? `?u=${visitorId}` : ""}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopyFeedback(true);
    trackShare("copy");
    setTimeout(() => setCopyFeedback(false), 2000);
  };

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

  const model = exif ? [exif.make, exif.model].filter(Boolean).join(" ") : "";
  const aperture = exif && exif.fNumber !== undefined && exif.fNumber !== null ? formatFNumber(exif.fNumber) : "";
  const shutter = exif && exif.exposureTime !== undefined && exif.exposureTime !== null ? formatShutter(exif.exposureTime) : "";
  const iso = exif && exif.iso !== undefined && exif.iso !== null ? `ISO ${exif.iso}` : "";
const focal = exif && exif.focalLength !== undefined && exif.focalLength !== null ? formatFocal(exif.focalLength) : "";
  const date = exif && exif.dateTimeOriginal ? formatDate(exif.dateTimeOriginal) : "";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col justify-center p-4 md:p-6 bg-black/98 transition-opacity duration-300 overflow-y-auto h-[100dvh]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onClose}
    >
      {/* Close button - Fixed Top Right */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-[9999] flex h-10 w-10 items-center justify-center bg-black/50 text-white/80 active:scale-95"
        aria-label="Close lightbox"
      >
        <FiX className="w-5 h-5" />
      </button>

      {/* Main Image Container - Capped at max-height 65vh */}
      <div
        className="w-full max-w-4xl mx-auto relative flex items-center justify-center overflow-hidden h-[55vh] max-h-[65vh] flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="relative w-full h-full flex items-center justify-center select-none cursor-pointer overflow-hidden group/image"
          onClick={handleImageClick}
        >
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/40 animate-pulse z-[5] pointer-events-none">
              <div className="w-8 h-8 border-2 border-white/10 border-t-white/80 rounded-full animate-spin" />
            </div>
          )}

          {imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 z-10 gap-3">
              <span className="text-xs text-white/50 font-inter">Failed to load photograph</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageError(false);
                  setIsImageLoading(true);
                  setRetryKey((prev) => prev + 1);
                }}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-medium font-inter transition-all"
              >
                Retry
              </button>
            </div>
          )}

          <Image
            src={retryKey > 0 ? `${currentPhoto.imageUrl}?retry=${retryKey}` : currentPhoto.imageUrl}
            alt={currentPhoto.title ?? "Photo"}
            fill
            className="object-contain transition-all duration-300 w-full h-full max-h-[65vh] min-h-0"
            sizes="(max-width: 768px) 100vw, 80vw"
            priority
            unoptimized
            onLoad={() => setIsImageLoading(false)}
            onError={() => {
              setImageError(true);
              setIsImageLoading(false);
            }}
          />

          {/* Custom drawing heart that scales */}
          {showHeart && (
            <div 
              key={heartKey}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none select-none animate-instagram-heart"
            >
              <svg 
                viewBox="0 0 24 24" 
                className="w-20 h-20 text-red-500 fill-current drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          )}

          {/* Burst Particles */}
          {particles.map((p) => {
            return (
              <div
                key={p.id}
                className="absolute z-30 pointer-events-none animate-particle-rich"
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
                  className="w-full h-full fill-current drop-shadow-[0_0_4px_rgba(0,0,0,0.3)]"
                  style={{ color: p.color }}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info & Metadata Panel - Placed below the centered image */}
      <div 
        className="w-full max-w-4xl mx-auto flex flex-col shrink-0 mt-4 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Heart/Download/Share Actions: Left-aligned, own row above title */}
        <div className="flex items-center gap-5 py-2 border-b border-white/5 shrink-0">
          <button 
            onClick={handleLike} 
            className="flex items-center gap-1.5 font-inter text-xs text-white/80 hover:text-red-450 transition-colors"
          >
            <FiHeart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            <span>{likes}</span>
          </button>
          
          <button 
            onClick={handleDownload} 
            className="flex items-center gap-1.5 font-inter text-xs text-white/80 hover:text-[#10B981] transition-colors"
          >
            <FiDownload className="w-4 h-4" />
            <span>{downloads}</span>
          </button>

          <button 
            onClick={() => setShowShareModal(true)} 
            className="flex items-center gap-1.5 font-inter text-xs text-white/80 hover:text-amber-500 transition-colors"
          >
            <FiShare2 className="w-4 h-4" />
            <span>{shares}</span>
          </button>
        </div>

        {/* Text descriptions, Title and EXIF row details */}
        <div className="w-full text-left mt-2 select-text overflow-y-auto max-h-[22vh] pr-1">
          {currentPhoto.title && (
            <h3 className="text-base font-semibold text-white uppercase tracking-wider">
              {currentPhoto.title}
            </h3>
          )}

          {currentPhoto.description && (
            <p className="text-sm text-white/70 mt-1 leading-relaxed">
              {currentPhoto.description}
            </p>
          )}

          {/* EXIF metadata row: presented on two separate lines */}
          {hasExif && (
            <div className="mt-3 space-y-1.5 border-t border-white/5 pt-2">
              {/* Line 1: Camera model + aperture + shutter speed */}
              {(model || aperture || shutter) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/50 font-mono">
                  {model && (
                    <span className="flex items-center gap-1 shrink-0">
                      <FiCamera className="w-3.5 h-3.5 text-amber-500" />
                      <span>{model}</span>
                    </span>
                  )}
                  {aperture && (
                    <span className="flex items-center gap-1 shrink-0">
                      <FiSliders className="w-3.5 h-3.5 text-amber-500" />
                      <span>{aperture}</span>
                    </span>
                  )}
                  {shutter && (
                    <span className="flex items-center gap-1 shrink-0">
                      <FiClock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{shutter}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Line 2: ISO + focal length + date */}
              {(iso || focal || date) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/50 font-mono">
                  {iso && (
                    <span className="flex items-center gap-1 shrink-0">
                      <FiLayers className="w-3.5 h-3.5 text-amber-500" />
                      <span>{iso}</span>
                    </span>
                  )}
                  {focal && (
                    <span className="flex items-center gap-1 shrink-0">
                      <FiMaximize className="w-3.5 h-3.5 text-amber-500" />
                      <span>{focal}</span>
                    </span>
                  )}
                  {date && (
                    <span className="flex items-center gap-1 shrink-0">
                      <FiCalendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>{date}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination dots: centered, in a separate row below the actions & description */}
        <div className="flex justify-center items-center gap-1 select-none py-3 border-t border-white/5 mt-2 shrink-0">
          {photos.map((_, i) => {
            const distance = Math.abs(i - currentIndex);
            if (distance >= 3) return null;
            
            if (distance === 0) {
              return (
                <span 
                  key={i} 
                  className="w-4 h-1 rounded-full bg-amber-500 transition-all duration-300"
                />
              );
            } else if (distance === 1) {
              return (
                <span 
                  key={i} 
                  className="w-1.5 h-1.5 rounded-full bg-white/70 transition-all duration-300"
                />
              );
            } else {
              return (
                <span 
                  key={i} 
                  className="w-1.5 h-1.5 rounded-full bg-white/30 transition-all duration-300"
                />
              );
            }
          })}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-[#111] border border-white/10 p-6 max-w-sm w-full mx-4 relative"
            style={{ borderRadius: "0px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <FiX className="w-5 h-5" />
            </button>
            
            <h4 className="font-syne font-bold text-white text-base uppercase tracking-tight mb-4">
              Share Photograph
            </h4>

            {/* Native share button if supported on device */}
            {canShareNative && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 mb-4 p-2.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold uppercase tracking-wider transition-all duration-300 active:scale-95"
              >
                <span>Share Image & Link</span>
              </button>
            )}

            {/* Social options */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <a 
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackShare("linkedin")}
                className="flex flex-col items-center gap-1.5 p-3 bg-white/5 border border-white/5 hover:border-amber-500/50 hover:bg-white/10 text-white/80 hover:text-white transition-all"
              >
                <FaLinkedinIn className="w-5 h-5" />
                <span className="text-[10px] font-inter">LinkedIn</span>
              </a>
              
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this photo: "${currentPhoto.title || ""}"\nLink: ${shareLink}\nImage: ${currentPhoto.imageUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackShare("whatsapp")}
                className="flex flex-col items-center gap-1.5 p-3 bg-white/5 border border-white/5 hover:border-amber-500/50 hover:bg-white/10 text-white/80 hover:text-white transition-all"
              >
                <FaWhatsapp className="w-5 h-5" />
                <span className="text-[10px] font-inter">WhatsApp</span>
              </a>

              <a 
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(`Check out "${currentPhoto.title || ""}" - Direct image: ${currentPhoto.imageUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackShare("twitter")}
                className="flex flex-col items-center gap-1.5 p-3 bg-white/5 border border-white/5 hover:border-amber-500/50 hover:bg-white/10 text-white/80 hover:text-white transition-all"
              >
                <FaTwitter className="w-5 h-5" />
                <span className="text-[10px] font-inter">Twitter/X</span>
              </a>

              <a 
                href={`https://www.instagram.com/`}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackShare("instagram")}
                className="flex flex-col items-center gap-1.5 p-3 bg-white/5 border border-white/5 hover:border-amber-500/50 hover:bg-white/10 text-white/80 hover:text-white transition-all"
              >
                <FaInstagram className="w-5 h-5" />
                <span className="text-[10px] font-inter">Instagram</span>
              </a>
            </div>

            {/* Direct Copy link */}
            <div className="flex gap-2 bg-black/40 border border-white/10 p-2.5">
              <input 
                type="text" 
                readOnly 
                value={shareLink} 
                className="bg-transparent text-white/70 text-xs flex-grow outline-none border-none pointer-events-none select-all truncate"
              />
              <button 
                onClick={copyToClipboard}
                className="text-amber-500 hover:text-amber-400 p-1 flex items-center justify-center"
                title="Copy link"
              >
                {copyFeedback ? (
                  <span className="text-[10px] font-inter text-green font-medium">Copied!</span>
                ) : (
                  <FiCopy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Navigation Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 hidden md:flex h-12 w-12 items-center justify-center border border-white/10 bg-black/40 text-white transition hover:bg-white/10 hover:border-white/20 active:scale-95 z-10"
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
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 hidden md:flex h-12 w-12 items-center justify-center border border-white/10 bg-black/40 text-white transition hover:bg-white/10 hover:border-white/20 active:scale-95 z-10"
        aria-label="Next photo"
        style={{ borderRadius: "0px" }}
      >
        <span className="text-lg">→</span>
      </button>

      {/* Animation Styles */}
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
    </div>,
    document.body
  );
}
