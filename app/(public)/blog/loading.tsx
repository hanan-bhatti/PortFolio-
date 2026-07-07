"use client";

/**
 * @file app/(public)/blog/loading.tsx
 * @description Next.js route view page or layout component for loading.tsx.
 * 
 * @exports
 * - Loading (default): Main React component or function
 */

import { Skeleton } from "boneyard-js/react";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 md:pt-32 pb-20">
      <div className="relative mb-16 flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white">
          The <span className="gradient-text font-black">Blog</span>
        </h1>
        <p className="mt-4 text-zinc-400 max-w-md">
          Articles on web development, software engineering, and modern tech.
        </p>
      </div>
      <Skeleton name="blog-index" loading={true}>
        <div />
      </Skeleton>
    </div>
  );
}
