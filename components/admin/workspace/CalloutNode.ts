import { Node, mergeAttributes } from "@tiptap/core";

export const CalloutNode = Node.create({
  name: "callout",
  group: "block",
  content: "inline*",
  defining: true,

  addAttributes() {
    return {
      type: {
        default: "info", // info | tip | warning | error
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const type = node.attrs.type || "info";
    let icon = "ℹ️";
    let classes = "border-l-4 border-blue-500 bg-blue-950/15 text-blue-200";

    if (type === "tip") {
      icon = "💡";
      classes = "border-l-4 border-amber bg-amber/5 text-amber-200";
    } else if (type === "warning") {
      icon = "⚠️";
      classes = "border-l-4 border-orange-500 bg-orange-950/15 text-orange-200";
    } else if (type === "error") {
      icon = "❌";
      classes = "border-l-4 border-red-500 bg-red-950/15 text-red-200";
    }

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "callout",
        class: `p-4 my-4 flex items-start gap-3 text-xs leading-relaxed ${classes}`,
      }),
      ["span", { class: "shrink-0 select-none mt-0.5" }, icon],
      ["div", { class: "flex-1 outline-none" }, 0],
    ];
  },
});
export default CalloutNode;
