/**
 * @file lib/tiptap-html.ts
 * @description Services for converting Tiptap JSON content to HTML, applying syntax highlighting, adjusting header levels, and building Tables of Contents (TOC).
 * 
 * @exports
 * - TocItem: Interface representing a Table of Contents heading item
 * - renderPostContent(content): Parses Tiptap JSON, highlights code blocks, lowers headings (SEO), and populates a TOC
 */

import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/core";
import { baseExtensions, lowlight } from "@/lib/tiptap-extensions";
import { slugify } from "@/lib/utils";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: {
    className?: string[];
    [key: string]: any;
  };
  children?: HastNode[];
}

function hastToHtml(node: HastNode): string {
  if (node.type === "text") {
    return (node.value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  if (node.type === "element" && node.tagName) {
    const className = node.properties?.className?.join(" ") || "";
    const classAttr = className ? ` class="${className}"` : "";
    const childrenHtml = (node.children || []).map(hastToHtml).join("");
    return `<${node.tagName}${classAttr}>${childrenHtml}</${node.tagName}>`;
  }
  return "";
}

function highlightCode(code: string, lang: string): string {
  try {
    if (lang) {
      const hast = lowlight.highlight(lang, code);
      return hast.children.map((child: any) => hastToHtml(child)).join("");
    }
  } catch {
    // Fail silent and fall back to auto-highlight
  }
  try {
    const hast = lowlight.highlightAuto(code);
    return hast.children.map((child: any) => hastToHtml(child)).join("");
  } catch (e) {
    console.error("Syntax highlighting error:", e);
    return code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&");
}

export function renderPostContent(content: string): { html: string; toc: TocItem[] } {
  let json: JSONContent;
  try {
    json = JSON.parse(content) as JSONContent;
  } catch {
    return { html: "<p>Unable to render this post.</p>", toc: [] };
  }

  let html = generateHTML(json, baseExtensions());

  // Rewrite image sources to use Next.js image optimizer and add lazy loading
  html = html.replace(/<img\s+([^>]*)\b(src=["']([^"']+)["'])([^>]*)>/g, (match, before, srcAttr, src, after) => {
    // Skip relative URLs, data URLs, or already optimized URLs
    if (src.startsWith("/") || src.startsWith("data:") || src.includes("_next/image")) {
      return match;
    }

    const optimizedSrc = `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`;
    
    let extraAttrs = "";
    const combined = before + " " + after;
    if (!combined.includes("loading=")) {
      extraAttrs += ' loading="lazy"';
    }
    if (!combined.includes("decoding=")) {
      extraAttrs += ' decoding="async"';
    }

    return `<img ${before} src="${optimizedSrc}" ${after}${extraAttrs}>`;
  });

  // Apply server-side syntax highlighting to code blocks
  html = html.replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (match, attrs: string, codeContent: string) => {
    const classMatch = attrs.match(/class=["']([^"']*)["']/);
    const classes = classMatch && classMatch[1] ? classMatch[1].split(/\s+/) : [];
    const langClass = classes.find((c) => c.startsWith("language-"));
    const lang = langClass ? langClass.replace("language-", "") : "";

    const decodedCode = decodeHtmlEntities(codeContent);
    const highlighted = highlightCode(decodedCode, lang);
    return `<pre><code${attrs}>${highlighted}</code></pre>`;
  });

  // Shift body headings down by one level to enforce a single H1 on the page
  html = html.replace(/<(\/?)h([1-4])([^>]*)>/g, (_match, closeSlash, lvl, attrs) => {
    const nextLvl = Number(lvl) + 1;
    return `<${closeSlash}h${nextLvl}${attrs}>`;
  });

  const toc: TocItem[] = [];
  const seenSlugs: Record<string, number> = {};

  // Parse h2 to h5 for the table of contents
  html = html.replace(/<h([2-5])([^>]*)>([\s\S]*?)<\/h\1>/g, (_match, lvl: string, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    const baseSlug = slugify(text) || "section";
    let id = baseSlug;
    if (seenSlugs[baseSlug] !== undefined) {
      seenSlugs[baseSlug]++;
      id = `${baseSlug}-${seenSlugs[baseSlug]}`;
    } else {
      seenSlugs[baseSlug] = 0;
    }
    // Adjust TOC level back by 1 so the visual indentation in the TOC component is preserved
    toc.push({ id, text, level: Number(lvl) - 1 });
    return `<h${lvl}${attrs} id="${id}">${inner}</h${lvl}>`;
  });

  return { html, toc };
}
