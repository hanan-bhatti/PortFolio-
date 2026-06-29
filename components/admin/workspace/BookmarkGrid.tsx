"use client";

import { useState } from "react";
import BookmarkCard from "./BookmarkCard";
import AddBookmarkForm from "./AddBookmarkForm";
import { FiPlus, FiLink } from "react-icons/fi";
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

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  pageId: string | null;
  onAddBookmark: (bookmark: Omit<Bookmark, "id">) => void;
  onUpdateBookmark: (id: string, fields: Partial<Bookmark>) => void;
  onDeleteBookmark: (id: string) => void;
}

export default function BookmarkGrid({ bookmarks, pageId, onAddBookmark, onUpdateBookmark, onDeleteBookmark }: BookmarkGridProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Extract unique categories
  const categories = Array.from(new Set(bookmarks.map((b) => b.category)));
  
  const handleSave = (fields: Omit<Bookmark, "id">) => {
    if (editingBookmark) {
      onUpdateBookmark(editingBookmark.id, fields);
      setEditingBookmark(null);
    } else {
      onAddBookmark(fields);
    }
    setShowForm(false);
  };

  const filteredBookmarks = activeTab === "all" ? bookmarks : bookmarks.filter((b) => b.category === activeTab);

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#262626] pb-3 select-none">
        {/* Category Pill Filters */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3 py-1 border font-mono text-[9px] font-bold uppercase transition-colors rounded-none outline-none",
              activeTab === "all"
                ? "border-amber bg-amber/5 text-amber"
                : "border-[#262626] text-zinc-500 hover:border-zinc-400"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={cn(
                "px-3 py-1 border font-mono text-[9px] font-bold uppercase transition-colors rounded-none outline-none",
                activeTab === cat
                  ? "border-amber bg-amber/5 text-amber"
                  : "border-[#262626] text-zinc-500 hover:border-zinc-400"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setEditingBookmark(null);
            setShowForm(!showForm);
          }}
          className="flex items-center gap-1.5 border border-[#262626] bg-[#0c0c0c] hover:border-amber hover:text-amber font-mono text-[10px] font-bold text-white px-3.5 py-1.5 transition-colors rounded-none outline-none"
        >
          <FiPlus className="h-4 w-4" /> Add Bookmark
        </button>
      </div>

      {/* Add / Edit Form */}
      {(showForm || editingBookmark) && (
        <AddBookmarkForm
          initialData={editingBookmark}
          categoriesList={categories}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingBookmark(null);
          }}
        />
      )}

      {/* Bookmarks Grid / Group Layout */}
      {filteredBookmarks.length > 0 ? (
        activeTab === "all" ? (
          <div className="space-y-8 select-none">
            {/* Group by category */}
            {Array.from(new Set(filteredBookmarks.map((b) => b.category))).map((cat) => {
              const catBookmarks = filteredBookmarks.filter((b) => b.category === cat);
              return (
                <div key={cat} className="space-y-3">
                  <h3 className="font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest border-b border-[#262626]/50 pb-1.5">
                    {cat} <span className="text-zinc-650 font-normal">({catBookmarks.length})</span>
                  </h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {catBookmarks.map((bookmark) => (
                      <BookmarkCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        onEdit={() => setEditingBookmark(bookmark)}
                        onDelete={() => onDeleteBookmark(bookmark.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 select-none">
            {filteredBookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={() => setEditingBookmark(bookmark)}
                onDelete={() => onDeleteBookmark(bookmark.id)}
              />
            ))}
          </div>
        )
      ) : (
        <div className="border border-dashed border-[#262626] py-16 text-center select-none">
          <FiLink className="h-6 w-6 text-zinc-700 mx-auto mb-2" />
          <p className="font-mono text-xs text-zinc-650 uppercase">No bookmark links logged</p>
        </div>
      )}
    </div>
  );
}
