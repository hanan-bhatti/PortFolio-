"use client";

/**
 * @file components/ui/HeroPhoto.tsx
 * @description React component for HeroPhoto.tsx under the ui category.
 * 
 * @exports
 * - HeroPhoto (default): Main React component or function
 */

import { useEffect, useRef, useState, useCallback } from "react";

interface HeroPhotoProps {
  src: string;
  alt: string;
}

function getContainBottomRect(
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number,
  alignRight: boolean
) {
  const canvasRatio = canvasWidth / canvasHeight;
  const imageRatio = imageWidth / imageHeight;

  let dw = canvasWidth;
  let dh = canvasHeight;

  if (imageRatio > canvasRatio) {
    dw = canvasWidth;
    dh = canvasWidth / imageRatio;
  } else {
    dh = canvasHeight;
    dw = canvasHeight * imageRatio;
  }

  const dx = alignRight ? canvasWidth - dw : (canvasWidth - dw) / 2;
  const dy = canvasHeight - dh;

  return { dx, dy, dw, dh };
}

export default function HeroPhoto({ src, alt }: HeroPhotoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [hovered, setHovered] = useState(false);

  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const strength = useRef(0); // 0 (clean) to 1 (full pixelation strength)

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;

    let offscreen = offscreenCanvasRef.current;
    if (!offscreen) {
      offscreen = document.createElement("canvas");
      offscreenCanvasRef.current = offscreen;
    }

    const ctx = canvas.getContext("2d");
    const octx = offscreen.getContext("2d", { willReadFrequently: true });
    if (!ctx || !octx) return;

    const w = canvas.width;
    const h = canvas.height;
    const img = imgRef.current;

    if (w <= 0 || h <= 0 || img.width <= 0 || img.height <= 0) return;

    // Keep offscreen canvas dimensions aligned
    if (offscreen.width !== w || offscreen.height !== h) {
      offscreen.width = w;
      offscreen.height = h;
    }

    const isMobile = w < 768;

    // Draw clean image to offscreen canvas
    // Always right-align: on mobile the portrait acts as atmospheric background
    // with face peeking from right side, matching desktop language
    octx.clearRect(0, 0, w, h);
    const rect = getContainBottomRect(w, h, img.width, img.height, true);
    octx.drawImage(img, rect.dx, rect.dy, rect.dw, rect.dh);

    const currentStrength = strength.current;
    if (currentStrength <= 0.01) {
      // Just copy offscreen clean image directly to main canvas
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(offscreen, 0, 0);
      return;
    }

    // Try-catch block for reading pixel data to prevent CORS SecurityError
    let cleanData;
    try {
      cleanData = octx.getImageData(0, 0, w, h);
    } catch (e) {
      console.warn("HeroPhoto: Canvas tainted by CORS, falling back to standard rendering.", e);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(offscreen, 0, 0);
      return;
    }

    const cleanPixels = cleanData.data;

    // Get main canvas pixels
    const mainData = ctx.createImageData(w, h);
    const mainPixels = mainData.data;

    // Native fast copy of clean pixels to start with
    mainPixels.set(cleanPixels);

    // Circular spotlight calculation
    const radius = 120 * currentStrength;
    const mx = mouseX.current;
    const my = mouseY.current;
    const maxPixelSize = 1 + 19 * currentStrength;

    // Restrict loop strictly to bounding box of the circular spotlight
    const startX = Math.max(0, Math.floor(mx - radius));
    const endX = Math.min(w - 1, Math.ceil(mx + radius));
    const startY = Math.max(0, Math.floor(my - radius));
    const endY = Math.min(h - 1, Math.ceil(my + radius));

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const dx = x - mx;
        const dy = y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius) {
          const progress = 1 - dist / radius; // 1 at center, 0 at edge
          const S = 1 + (maxPixelSize - 1) * progress;

          if (S > 1.05) {
            let sx = Math.floor(Math.round(x / S) * S);
            let sy = Math.floor(Math.round(y / S) * S);

            sx = Math.max(0, Math.min(w - 1, sx));
            sy = Math.max(0, Math.min(h - 1, sy));

            const srcIdx = (sy * w + sx) * 4;
            const destIdx = (y * w + x) * 4;

            let r = cleanPixels[srcIdx] ?? 0;
            let g = cleanPixels[srcIdx + 1] ?? 0;
            let b = cleanPixels[srcIdx + 2] ?? 0;
            const a = cleanPixels[srcIdx + 3] ?? 255;

            // Blend amber tint proportional to progress * 0.2
            const amberOpacity = progress * 0.2;
            r = r * (1 - amberOpacity) + 245 * amberOpacity;
            g = g * (1 - amberOpacity) + 158 * amberOpacity;
            b = b * (1 - amberOpacity) + 11 * amberOpacity;

            mainPixels[destIdx] = r;
            mainPixels[destIdx + 1] = g;
            mainPixels[destIdx + 2] = b;
            mainPixels[destIdx + 3] = a;
          }
        }
      }
    }

    ctx.putImageData(mainData, 0, 0);
  }, []);

  const triggerRender = useCallback(() => {
    render();
  }, [render]);

  // Load image with fallback retry for CORS/CDN compatibility
  useEffect(() => {
    // Route through Next.js image optimization endpoint to resize and compress the image
    const isLocalPublic = src.startsWith("/") && !src.startsWith("/_next");
    const isRemote = src.startsWith("http");
    const isDev = process.env.NODE_ENV === "development";
    
    let optimizedSrc = src;
    if (!isDev && (isLocalPublic || isRemote)) {
      optimizedSrc = `/_next/image?url=${encodeURIComponent(src)}&w=640&q=75`;
    }

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      triggerRender();
    };
    img.onerror = () => {
      console.warn("CORS request failed for HeroPhoto, retrying without credentials...");
      const retryImg = new window.Image();
      retryImg.onload = () => {
        imgRef.current = retryImg;
        triggerRender();
      };
      retryImg.src = optimizedSrc;
    };
    img.src = optimizedSrc;
  }, [src, triggerRender]);

  // Track size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const w = container.clientWidth;
      const h = container.clientHeight;

      canvas.width = w;
      canvas.height = h;
      triggerRender();
    };

    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    const container = containerRef.current;
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [triggerRender]);

  // Animation Loop - updates strength towards target and calls render
  useEffect(() => {
    let animFrameId: number;

    const loop = () => {
      const target = hovered ? 1 : 0;
      const diff = target - strength.current;

      if (Math.abs(diff) < 0.01) {
        strength.current = target;
        triggerRender();
        if (target === 0) {
          return; // stop drawing loop to conserve CPU
        }
      } else {
        strength.current += diff * 0.12; // Easing transition
        triggerRender();
      }

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [hovered, triggerRender]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Calculate canvas internal coordinates taking CSS scaling into account
    mouseX.current = (clientX / rect.width) * canvas.width;
    mouseY.current = (clientY / rect.height) * canvas.height;

    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-crosshair select-none pointer-events-auto"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain object-bottom grayscale transition-all"
        style={{ filter: "grayscale(100%)" }}
      />
    </div>
  );
}
