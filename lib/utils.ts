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
