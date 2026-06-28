"use client";

/**
 * @file components/ui/PhotoLightbox.tsx
 * @description React component for PhotoLightbox.tsx under the ui category.
 * 
 * @exports
 * - PhotoLightbox (default): Main React component or function
 */

import { useEffect, useState, useCallback, useRef } from "react";
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
  
  const lastTapRef = useRef<number>(0);
  const heartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Sync state with current photo
  useEffect(() => {
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
      // Fetch the image as a blob to bypass cross-origin browser download restrictions
      try {
        const response = await fetch(currentPhoto.imageUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = currentPhoto.title
          ? `${currentPhoto.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`
          : `photo-${currentPhoto.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (corsErr) {
        // Fallback for CORS block: open in a new tab
        console.warn("Direct blob download failed, falling back to new tab:", corsErr);
        const link = document.createElement("a");
        link.href = currentPhoto.imageUrl;
        link.download = currentPhoto.title || `photo-${currentPhoto.id}`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Increment locally
      setDownloads((prev) => prev + 1);

      await fetch(`/api/photography/${currentPhoto.id}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      });
    } catch (err) {
      console.error(err);
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
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/98 transition-opacity duration-300"
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
        <div 
          className="relative w-full h-[55vh] md:h-[65vh] flex items-center justify-center select-none cursor-pointer overflow-hidden group/image"
          onClick={handleImageClick}
        >
          <Image
            src={currentPhoto.imageUrl}
            alt={currentPhoto.title ?? "Photo"}
            fill
            className="object-contain transition-all duration-300"
            sizes="(max-width: 768px) 100vw, 80vw"
            priority
            unoptimized
          />

          {/* Custom drawing heart that scales */}
          {showHeart && (
            <div 
              key={heartKey}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none select-none animate-instagram-heart"
            >
              <svg 
                viewBox="0 0 24 24" 
                className="w-24 h-24 text-red-500 fill-current drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]"
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

        {/* Bottom actions & indicators bar */}
        <div className="flex items-center justify-between mt-4 w-full border-b border-white/5 pb-3">
          {/* Actions on the left */}
          <div className="flex items-center gap-5">
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

          {/* Instagram style pagination dots with sliding window */}
          <div className="flex items-center gap-1 select-none">
            {photos.map((_, i) => {
              const distance = Math.abs(i - currentIndex);
              if (distance >= 3) return null; // Show only active bar, neighbors, and fading dots
              
              if (distance === 0) {
                // Wide bar for current image
                return (
                  <span 
                    key={i} 
                    className="w-4 h-1 rounded-full bg-amber-500 transition-all duration-300"
                  />
                );
              } else if (distance === 1) {
                // Neighbors
                return (
                  <span 
                    key={i} 
                    className="w-1.5 h-1.5 rounded-full bg-white/70 transition-all duration-300"
                  />
                );
              } else {
                // Edge fading dots
                return (
                  <span 
                    key={i} 
                    className="w-1 h-1 rounded-full bg-white/30 transition-all duration-300"
                  />
                );
              }
            })}
          </div>
        </div>

        {/* Info panel below the image */}
        <div className="w-full mt-4 font-inter text-left space-y-3">
          {/* Main Caption Card */}
          <div className="space-y-1">
            {currentPhoto.title && (
              <h3 className="font-syne text-sm font-bold text-white uppercase tracking-wider">
                {currentPhoto.title}
              </h3>
            )}
            {currentPhoto.description && (
              <p className="font-inter text-xs text-zinc-400 italic leading-relaxed">
                {currentPhoto.description}
              </p>
            )}
          </div>

          {/* Camera specs grid card */}
          {hasExif && exifItems.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-white/5">
              {exifItems.map((item, idx) => {
                const icon = getExifIcon(item.label);
                return (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 bg-white/[0.02] border border-white/5 px-2.5 py-1.5 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="p-1.5 bg-white/[0.03] border border-white/5 rounded-sm shrink-0">
                      {icon}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[7.5px] text-zinc-500 uppercase font-mono tracking-widest leading-none">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-zinc-300 font-medium font-mono mt-0.5 truncate leading-tight">
                        {item.value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this photo: ${shareLink}`)}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackShare("whatsapp")}
                className="flex flex-col items-center gap-1.5 p-3 bg-white/5 border border-white/5 hover:border-amber-500/50 hover:bg-white/10 text-white/80 hover:text-white transition-all"
              >
                <FaWhatsapp className="w-5 h-5" />
                <span className="text-[10px] font-inter">WhatsApp</span>
              </a>

              <a 
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(`Check out this photo: ${currentPhoto.title || ""}`)}`}
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
    </div>
  );
}
