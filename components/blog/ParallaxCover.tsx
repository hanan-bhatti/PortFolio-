"use client";

/**
 * @file components/blog/ParallaxCover.tsx
 * @description React component for ParallaxCover.tsx under the blog category.
 * 
 * @exports
 * - ParallaxCover (default): Main React component or function
 */

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

export default function ParallaxCover({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <div ref={ref} className="relative h-[40vh] w-full overflow-hidden md:h-[60vh]">
      <motion.div style={{ y }} className="absolute inset-0">
        <Image src={src} alt={alt} fill className="object-cover" priority />
      </motion.div>
      <div
        className="absolute inset-0 z-1 pointer-events-none"
        style={{
          background: "linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.3) 60%, rgba(10,10,10,0) 100%)",
        }}
      />
    </div>
  );
}
