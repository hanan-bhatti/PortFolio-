"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";

type CursorType = "default" | "pointer" | "text" | "loading";

export default function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [cursorType, setCursorType] = useState<CursorType>("loading");
  const [isVisible, setIsVisible] = useState(false);

  const cursorTypeRef = useRef<CursorType>("loading");
  const isVisibleRef = useRef<boolean>(false);

  useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    // Simulate page load loading cursor for a brief moment
    const timer = setTimeout(() => {
      setCursorType("default");
      cursorTypeRef.current = "default";
    }, 1200);

    const updateMousePosition = (e: MouseEvent) => {
      let xOffset = -12;
      let yOffset = -12;

      // Dynamically adjust offsets based on the cursor SVG layout
      const currentType = cursorTypeRef.current;
      if (currentType === "default") {
        xOffset = -6;
        yOffset = -3;
      } else if (currentType === "pointer") {
        xOffset = -10;
        yOffset = -5;
      }

      cursorX.set(e.clientX + xOffset);
      cursorY.set(e.clientY + yOffset);
      
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || !target.tagName) return;

      const computedCursor = window.getComputedStyle(target).cursor;
      let nextType: CursorType = "default";
      
      if (
        target.tagName.toLowerCase() === "input" ||
        target.tagName.toLowerCase() === "textarea" ||
        computedCursor === "text"
      ) {
        nextType = "text";
      } else if (
        target.tagName.toLowerCase() === "a" ||
        target.tagName.toLowerCase() === "button" ||
        target.closest("a") ||
        target.closest("button") ||
        computedCursor === "pointer"
      ) {
        nextType = "pointer";
      }

      if (cursorTypeRef.current !== nextType) {
        cursorTypeRef.current = nextType;
        setCursorType(nextType);
      }
    };

    const handleMouseLeave = () => {
      // Don't hide immediately on mouseout to prevent flickering
      // Only hide if the mouse actually leaves the window
    };
    
    const handleWindowLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 || e.clientX <= 0 || (e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
        isVisibleRef.current = false;
        setIsVisible(false);
      }
    };

    window.addEventListener("mousemove", updateMousePosition, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    window.addEventListener("mouseleave", handleWindowLeave, { passive: true });
    document.addEventListener("mouseleave", handleWindowLeave, { passive: true });

    // Hide native cursor globally (forced)
    const style = document.createElement("style");
    style.innerHTML = `* { cursor: none !important; }`;
    document.head.appendChild(style);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseleave", handleWindowLeave);
      document.removeEventListener("mouseleave", handleWindowLeave);
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [cursorX, cursorY]);

  if (!isVisible && cursorType !== "loading") return null;

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[10000] mix-blend-difference text-white flex items-center justify-center"
      style={{
        x: cursorX,
        y: cursorY,
        width: "24px",
        height: "24px",
      }}
    >
      <AnimatePresence mode="wait">
        {cursorType === "default" && (
          <motion.svg
            key="default"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-md"
          >
            <path
              d="M5.5 3.21V20.8C5.5 21.46 6.27 21.82 6.77 21.4L11.5 16.5H19.5C20.05 16.5 20.5 16.05 20.5 15.5V14.5C20.5 14.28 20.43 14.07 20.3 13.9L5.5 3.21Z"
              fill="white"
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}

        {cursorType === "pointer" && (
          <motion.svg
            key="pointer"
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15, type: "spring", stiffness: 300 }}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-md"
          >
            {/* Hand Pointer Graphic */}
            <path
              d="M9 11.5V6.5C9 5.12 10.12 4 11.5 4C12.88 4 14 5.12 14 6.5V11.5"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 10.5V8.5C14 7.12 15.12 6 16.5 6C17.88 6 19 7.12 19 8.5V13.5"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 13.5V10.5C9 9.12 7.88 8 6.5 8C5.12 8 4 9.12 4 10.5V15.5C4 18.54 6.46 21 9.5 21H14.5C17.54 21 20 18.54 20 15.5V11.5C20 10.12 18.88 9 17.5 9C16.12 9 15 10.12 15 11.5"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}

        {cursorType === "text" && (
          <motion.svg
            key="text"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-md"
          >
            {/* Text I-Beam Graphic */}
            <path
              d="M12 4V20M8 4H16M8 20H16"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}

        {cursorType === "loading" && (
          <motion.svg
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ opacity: { duration: 0.2 }, rotate: { duration: 1, repeat: Infinity, ease: "linear" } }}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-md"
          >
            {/* Loading Spinner Graphic */}
            <path
              d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="16 16"
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
