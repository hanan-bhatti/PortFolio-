"use client";

import { useState, useEffect } from "react";
import LinkPreviewCard from "./LinkPreviewCard";
import { FiX, FiCheck } from "react-icons/fi";
import { toast } from "sonner";
import InfoTooltip from "../InfoTooltip";

interface Bookmark {
  id?: string;
  url: string;
  title: string;
  description: string | null;
  category: string;
  favicon: string | null;
  ogImage: string | null;
  ogTitle: string | null;
  ogDesc: string | null;
}

interface AddBookmarkFormProps {
  initialData?: Bookmark | null;
  categoriesList: string[];
  onSave: (bookmark: Omit<Bookmark, "id">) => void;
  onCancel: () => void;
}

export default function AddBookmarkForm({ initialData, categoriesList, onSave, onCancel }: AddBookmarkFormProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  
  // Scraped preview details
  const [scrapedData, setScrapedData] = useState<any>(null);
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url);
      setTitle(initialData.title);
      setCategory(initialData.category);
      setScrapedData({
        title: initialData.ogTitle || initialData.title,
        description: initialData.ogDesc || initialData.description,
        image: initialData.ogImage,
        favicon: initialData.favicon,
        url: initialData.url,
      });
    }
  }, [initialData]);

  const handleUrlBlur = async () => {
    if (!url || !url.startsWith("http") || initialData) return;
    
    setScraping(true);
    setScrapedData(null);
    try {
      const res = await fetch(`/api/admin/workspace/link-preview?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        setScrapedData(data);
        setTitle(data.title || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScraping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    onSave({
      url,
      title: title || scrapedData?.title || "Untitled Link",
      description: scrapedData?.description || null,
      category: category.trim().toLowerCase() || "general",
      favicon: scrapedData?.favicon || null,
      ogImage: scrapedData?.image || null,
      ogTitle: scrapedData?.title || null,
      ogDesc: scrapedData?.description || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border border-[#262626] bg-[#0c0c0c] p-5 space-y-4 animate-slideDown select-none">
      <div className="flex items-center justify-between border-b border-[#262626] pb-2">
        <span className="font-mono text-[9px] font-bold text-zinc-550 uppercase tracking-widest">
          {initialData ? "Edit Bookmark" : "Add Bookmark Collection Item"}
        </span>
        <button type="button" onClick={onCancel} className="text-zinc-500 hover:text-white">
          <FiX className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3 font-mono text-[11px]">
        <div className="md:col-span-2">
          <label className="flex items-center gap-1 text-[9px] font-bold text-zinc-550 uppercase mb-1">
            Paste Link URL
            <InfoTooltip content="The webpage URL you want to bookmark (will auto-scrape title and meta data)." />
          </label>
          <input
            type="url"
            required
            placeholder="https://example.com/blog-post"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={handleUrlBlur}
            disabled={!!initialData}
            className="w-full bg-[#0c0c0c] border border-[#262626] p-2 text-xs text-white outline-none focus:border-amber rounded-none"
          />
        </div>

        <div>
          <label className="flex items-center gap-1 text-[9px] font-bold text-zinc-550 uppercase mb-1">
            Category Group
            <InfoTooltip content="Groups the bookmark for sorting (e.g., docs, tools, design)." />
          </label>
          <input
            type="text"
            list="workspace-bookmark-categories"
            placeholder="e.g. documentation, design"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[#0c0c0c] border border-[#262626] p-2 text-xs text-white outline-none focus:border-amber rounded-none"
          />
          <datalist id="workspace-bookmark-categories">
            {categoriesList.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-1 font-mono text-[9px] font-bold text-zinc-550 uppercase mb-1">
          Bookmark Display Title
          <InfoTooltip content="Custom label for this bookmark, overriding the auto-scraped page title." />
        </label>
        <input
          type="text"
          placeholder="Override scraped title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[#0c0c0c] border border-[#262626] p-2 text-xs text-white outline-none focus:border-amber rounded-none font-sans font-semibold"
        />
      </div>

      {/* Scraped Live Preview Box */}
      {(scraping || scrapedData) && (
        <div className="space-y-1">
          <span className="block font-mono text-[8px] font-bold text-zinc-550 uppercase">Link Preview Preview</span>
          <LinkPreviewCard data={scrapedData} loading={scraping} />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-[#262626]/40">
        <button
          type="button"
          onClick={onCancel}
          className="border border-[#262626] bg-black/40 hover:border-zinc-500 font-mono text-[9px] font-bold uppercase px-3 py-1.5 transition-colors rounded-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-amber/15 border border-amber/35 text-amber hover:bg-amber/25 font-mono text-[9px] font-bold uppercase px-4 py-1.5 transition-colors rounded-none flex items-center gap-1"
        >
          <FiCheck className="h-3 w-3" /> Save Bookmark
        </button>
      </div>
    </form>
  );
}
