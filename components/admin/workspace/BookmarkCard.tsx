"use client";

import { useState } from "react";
import { FiTrash2, FiEdit, FiLink } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string | null;
  category: string;
  favicon: string | null;
  ogImage: string | null;
  ogTitle: string | null;
  ogDesc: string | null;
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: () => void;
  onDelete: () => void;
}

export default function BookmarkCard({ bookmark, onEdit, onDelete }: BookmarkCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2000);
    }
  };

  const bannerImage = bookmark.ogImage || null;
  const faviconUrl = bookmark.favicon || "/favicon.ico";
  const displayTitle = bookmark.ogTitle || bookmark.title || "Untitled Link";
  const displayDesc = bookmark.ogDesc || bookmark.description || "No description is logged for this bookmark reference.";
  
  let domain = "external";
  try {
    const parsed = new URL(bookmark.url);
    domain = parsed.hostname.replace("www.", "");
  } catch (e) {}

  return (
    <div className="border border-[#262626] bg-[#0c0c0c] hover:border-amber hover:shadow-[0_0_12px_rgba(245,158,11,0.08)] transition-all select-none group flex flex-col h-[280px] rounded-none overflow-hidden relative">
      
      {/* Visual Banner */}
      {bannerImage ? (
        <div className="h-[120px] w-full overflow-hidden border-b border-[#262626]/80 bg-zinc-950 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerImage}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-350"
          />
        </div>
      ) : (
        <div className="h-[120px] w-full bg-gradient-to-br from-amber/15 via-[#0c0c0c] to-zinc-900/40 border-b border-[#262626]/60 flex items-center justify-center">
          <FiLink className="h-6 w-6 text-zinc-700" />
        </div>
      )}

      {/* Info Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Favicon & Domain & Category */}
          <div className="flex items-center justify-between gap-2 text-[9px] font-mono text-zinc-550 uppercase mb-2">
            <div className="flex items-center gap-1 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={faviconUrl}
                alt=""
                className="w-3.5 h-3.5 shrink-0 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="truncate">{domain}</span>
            </div>
            <span className="border border-amber/20 bg-amber/5 px-1.5 py-0.5 text-amber text-[7px] font-bold">
              {bookmark.category}
            </span>
          </div>

          <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
            <h4 className="text-xs font-bold text-white group-hover:text-amber transition-colors line-clamp-2 leading-snug cursor-pointer font-mono">
              {displayTitle}
            </h4>
          </a>

          <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed mt-1 font-sans">
            {displayDesc}
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex justify-end gap-1 items-center mt-3 pt-2 border-t border-[#262626]/30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-zinc-550 hover:text-white p-1"
            title="Edit bookmark"
          >
            <FiEdit className="h-3.5 w-3.5" />
          </button>
          
          <button
            onClick={handleDeleteClick}
            className={cn(
              "p-1 transition-colors font-mono text-[8px] uppercase font-bold",
              confirmDelete ? "text-red-500 hover:text-red-400" : "text-zinc-550 hover:text-red-500"
            )}
            title="Delete bookmark"
          >
            {confirmDelete ? "Delete?" : <FiTrash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
