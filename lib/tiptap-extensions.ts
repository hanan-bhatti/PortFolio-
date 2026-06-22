/**
 * @file lib/tiptap-extensions.ts
 * @description Configures base extensions for the Tiptap rich text editor, including custom styles, media embeds, tables, and lowlight syntax highlighting.
 * 
 * @exports
 * - lowlight: Configured instance of lowlight for code block syntax highlighting
 * - baseExtensions(): Array of configured Tiptap extensions used for content rendering and editor instantiation
 */

import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Youtube from "@tiptap/extension-youtube";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Node, mergeAttributes, type Extensions } from "@tiptap/core";

export const lowlight = createLowlight(common);

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (element) => element.style.width || element.getAttribute("width") || "100%",
      },
      alignment: {
        default: "center",
        parseHTML: (element) => {
          const margin = element.style.margin || "";
          if (margin.includes("0 auto 0 0") || margin.includes("0px auto 0px 0px")) return "left";
          if (margin.includes("0 0 0 auto") || margin.includes("0px 0px 0px auto")) return "right";
          return "center";
        },
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const width = node.attrs.width || "100%";
    const alignment = node.attrs.alignment || "center";
    
    let margin = "0 auto";
    if (alignment === "left") margin = "0 auto 0 0";
    else if (alignment === "right") margin = "0 0 0 auto";
    
    const style = `width: ${width}; max-width: 100%; height: auto; display: block; margin: ${margin};`;

    return [
      "img",
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        { style }
      )
    ];
  }
});

const CustomTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: (element) => element.getAttribute("class"),
        renderHTML: (attributes) => {
          if (!attributes.class) return {};
          return { class: attributes.class };
        },
      },
    };
  },
});

export const ImageGalleryNode = Node.create({
  name: "imageGallery",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: (element) => {
          const imgs = element.querySelectorAll("img");
          return Array.from(imgs).map((img) => img.getAttribute("src") || "");
        },
        renderHTML: (attributes) => ({}),
      },
      columns: {
        default: 3,
        parseHTML: (element) => {
          const className = element.getAttribute("class") || "";
          const match = className.match(/gallery-cols-(\d+)/);
          return (match && match[1]) ? parseInt(match[1], 10) : 3;
        },
        renderHTML: (attributes) => ({ class: `image-gallery-block gallery-cols-${attributes.columns}` }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div.image-gallery-block",
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const images = node.attrs.images || [];
    const imageElements = images.map((src: string) => [
      "div",
      { class: "gallery-item" },
      ["img", { src, class: "gallery-image" }]
    ]);
    return [
      "div",
      HTMLAttributes,
      ...imageElements,
    ];
  },
});

export const EngagementWidgetNode = Node.create({
  name: "engagementWidget",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      widget: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-widget"),
        renderHTML: (attributes) => ({
          "data-widget": attributes.widget,
          class: "engagement-widget-placeholder",
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-widget]",
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const widgetName = (node.attrs.widget || "").replace("-", " ").toUpperCase();
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        style: "border: 1px dashed #262626; background: rgba(12, 12, 12, 0.4); padding: 1rem; text-align: center; font-family: monospace; font-size: 11px; color: #71717a; user-select: none; margin: 1rem 0;"
      }),
      `[ENGAGEMENT WIDGET: ${widgetName}]`
    ];
  },
});

export function baseExtensions(): Extensions {
  return [
    StarterKit.configure({ codeBlock: false }),
    Underline,
    CustomImage.configure({ HTMLAttributes: { class: "rounded-none max-w-full h-auto" } }),
    Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
    Highlight,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Youtube.configure({ nocookie: true, width: 640, height: 360 }),
    CustomTable.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    CodeBlockLowlight.configure({ lowlight }),
    ImageGalleryNode,
    EngagementWidgetNode,
  ];
}

