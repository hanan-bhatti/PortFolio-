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

  const toc: TocItem[] = [];

  html = html.replace(/<h([1-4])([^>]*)>([\s\S]*?)<\/h\1>/g, (_match, lvl: string, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    const id = `${slugify(text) || "section"}-${toc.length}`;
    toc.push({ id, text, level: Number(lvl) });
    return `<h${lvl}${attrs} id="${id}">${inner}</h${lvl}>`;
  });

  return { html, toc };
}
