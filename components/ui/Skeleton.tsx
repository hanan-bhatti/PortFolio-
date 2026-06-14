/**
 * @file components/ui/Skeleton.tsx
 * @description A visual placeholder component rendering a pulsing container for skeleton-loading states.
 * 
 * @exports
 * - Skeleton: React component displaying the pulse placeholder
 */

import { cn } from "@/lib/utils";

export default function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-white/5", className)} />;
}
