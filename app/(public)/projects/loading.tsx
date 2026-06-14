"use client";

/**
 * @file app/(public)/projects/loading.tsx
 * @description Next.js route view page or layout component for loading.tsx.
 * 
 * @exports
 * - Loading (default): Main React component or function
 */

import { Skeleton } from "boneyard-js/react";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-32 pb-20">
      <div className="relative mb-12">
        <h1 className="text-4xl font-bold text-white md:text-5xl">
          <span className="gradient-text">Projects</span>
        </h1>
        <p className="mt-3 max-w-xl text-zinc-400">Things I have built — from full-stack apps to small experiments.</p>
      </div>
      <Skeleton name="projects-grid" loading={true}>
        <div />
      </Skeleton>
    </div>
  );
}
