"use client";

import { useMemo, useState } from "react";
import PostCard, { type PostCardData } from "@/components/blog/PostCard";
import { cn } from "@/lib/utils";
import { Skeleton } from "boneyard-js/react";

const PAGE_SIZE = 10;

export default function BlogIndex({ posts }: { posts: PostCardData[] }) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const tags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const matchesQuery =
        q === "" || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
      const matchesTag = activeTag === null || p.tags.includes(activeTag);
      return matchesQuery && matchesTag;
    });
  }, [posts, query, activeTag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const fixtureContent = (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="font-inter font-semibold text-[11px] tracking-[0.1em] uppercase px-4 py-1.5 border border-border bg-transparent text-text-muted rounded-none"
          >
            All
          </button>
          <button
            type="button"
            className="font-inter font-semibold text-[11px] tracking-[0.1em] uppercase px-4 py-1.5 border border-border bg-transparent text-text-muted rounded-none"
          >
            React
          </button>
        </div>
        <input
          type="search"
          placeholder="Search posts..."
          disabled
          className="bg-bg-surface border border-border rounded-none px-4 py-2 text-[13px] font-inter font-normal text-text-primary placeholder-text-muted w-full md:w-[220px]"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5rem]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-bg-surface border border-border overflow-hidden rounded-none h-[360px] p-5 flex flex-col justify-between">
            <div className="relative h-[200px] w-full bg-bg-elevated" />
            <div className="h-4 bg-white/5 w-1/4 mt-4" />
            <div className="h-4 bg-white/5 w-3/4 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Skeleton name="blog-index" loading={false} fixture={fixtureContent}>
      <div>
        {/* Filter Bar & Search Container */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          {/* Filter Tags */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTag(null);
                setPage(1);
              }}
              className={cn(
                "font-inter font-semibold text-[11px] tracking-[0.1em] uppercase px-4 py-1.5 border transition-colors duration-200 cursor-pointer rounded-none",
                activeTag === null
                  ? "bg-amber text-black border-amber"
                  : "bg-transparent text-text-muted border-border hover:border-amber hover:text-amber"
              )}
            >
              All
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setActiveTag(tag === activeTag ? null : tag);
                  setPage(1);
                }}
                className={cn(
                  "font-inter font-semibold text-[11px] tracking-[0.1em] uppercase px-4 py-1.5 border transition-colors duration-200 cursor-pointer rounded-none",
                  activeTag === tag
                    ? "bg-amber text-black border-amber"
                    : "bg-transparent text-text-muted border-border hover:border-amber hover:text-amber"
                )}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search posts..."
            className="bg-bg-surface border border-border rounded-none px-4 py-2 text-[13px] font-inter font-normal text-text-primary placeholder-[#6B7280] outline-none focus:border-amber w-full md:w-[220px] self-end md:self-auto"
          />
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5rem]">
          {visible.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>

        {/* Empty State */}
        {visible.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center text-center w-full">
            <h3 className="font-syne font-bold text-[2rem] text-border uppercase leading-none">
              Nothing here yet.
            </h3>
            <p className="mt-2 font-inter font-normal text-[13px] text-text-muted">
              Check back soon.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-5 py-2 text-sm font-inter font-medium border border-border bg-transparent text-text-muted hover:border-amber hover:text-amber transition-colors duration-200 disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-muted cursor-pointer rounded-none"
            >
              ← Prev
            </button>
            <span className="font-mono text-sm text-text-muted">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-5 py-2 text-sm font-inter font-medium border border-border bg-transparent text-text-muted hover:border-amber hover:text-amber transition-colors duration-200 disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-muted cursor-pointer rounded-none"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </Skeleton>
  );
}
