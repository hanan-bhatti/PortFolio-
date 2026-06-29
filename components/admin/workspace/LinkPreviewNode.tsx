"use client";

import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import LinkPreviewCard from "./LinkPreviewCard";
import React, { useEffect, useState } from "react";

function PreviewNodeView(props: any) {
  const url = props.node.attrs.url;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!url) return;
    let active = true;
    setLoading(true);
    setError("");

    fetch(`/api/admin/workspace/link-preview?url=${encodeURIComponent(url)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Preview failed");
        return res.json();
      })
      .then((resData) => {
        if (active) {
          setData(resData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Failed");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [url]);

  return (
    <NodeViewWrapper className="my-4 select-none cursor-pointer" contentEditable={false}>
      <LinkPreviewCard data={data} loading={loading} error={error} />
    </NodeViewWrapper>
  );
}

export const LinkPreviewNode = Node.create({
  name: "linkPreview",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      url: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="link-preview"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { "data-type": "link-preview", class: "link-preview-wrapper" }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PreviewNodeView);
  },
});

export default LinkPreviewNode;
