import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/core";
import { baseExtensions } from "@/lib/tiptap-extensions";
import { slugify } from "@/lib/utils";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function renderPostContent(content: string): { html: string; toc: TocItem[] } {
  let json: JSONContent;
  try {
    json = JSON.parse(content) as JSONContent;
  } catch {
    return { html: "<p>Unable to render this post.</p>", toc: [] };
  }

  let html = generateHTML(json, baseExtensions());
  const toc: TocItem[] = [];

  html = html.replace(/<h([1-4])([^>]*)>([\s\S]*?)<\/h\1>/g, (_match, lvl: string, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    const id = `${slugify(text) || "section"}-${toc.length}`;
    toc.push({ id, text, level: Number(lvl) });
    return `<h${lvl}${attrs} id="${id}">${inner}</h${lvl}>`;
  });

  return { html, toc };
}
