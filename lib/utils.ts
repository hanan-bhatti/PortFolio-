/**
 * @file lib/utils.ts
 * @description Core utility functions for Tailwind class merging, string transformations, formatting, reading time calculation, and social handle normalisation.
 * 
 * @exports
 * - cn(...inputs): Merges Tailwind CSS class names safely using clsx and tailwind-merge
 * - slugify(text): Standardises text strings into URL-friendly slugs
 * - formatDate(date): Formats Date objects or ISO strings into "Month Day, Year" strings
 * - readingTime(tiptapJson): Estimates average reading time for Tiptap JSON document/content
 * - extractTwitterUsername(urlOrHandle): Cleans and formats raw inputs into structured Twitter handles
 * - generateShortCode(length): Generates a random alphanumeric short code for URLs
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function readingTime(tiptapJson: string): number {
  let words = 0;
  try {
    const doc: unknown = JSON.parse(tiptapJson);
    const walk = (node: unknown): void => {
      if (typeof node !== "object" || node === null) return;
      const n = node as { text?: string; content?: unknown[] };
      if (typeof n.text === "string") {
        words += n.text.split(/\s+/).filter(Boolean).length;
      }
      if (Array.isArray(n.content)) n.content.forEach(walk);
    };
    walk(doc);
  } catch {
    words = tiptapJson.split(/\s+/).filter(Boolean).length;
  }
  return Math.max(1, Math.ceil(words / 200));
}

export function extractTwitterUsername(urlOrHandle: string): string {
  if (!urlOrHandle) return "@hananbhatti_";
  const clean = urlOrHandle.trim();
  if (!clean) return "@hananbhatti_";

  try {
    if (clean.includes("twitter.com") || clean.includes("x.com")) {
      const url = new URL(clean.startsWith("http") ? clean : `https://${clean}`);
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (pathParts[0]) {
        return `@${pathParts[0]}`;
      }
    }
  } catch {
    // Ignore URL parsing exceptions
  }

  if (clean.startsWith("@")) {
    return clean;
  }

  return `@${clean}`;
}

export function generateShortCode(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
