"use client";

import { useMemo, useState } from "react";
import PostCard, { type PostCardData } from "@/components/blog/PostCard";
import { cn } from "@/lib/utils";

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

  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-4">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search posts..."
          className="glass w-full max-w-md rounded-full px-5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-indigo-accent"
        />
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTag(null);
              setPage(1);
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              activeTag === null ? "bg-cyan-accent text-black" : "glass text-zinc-300 hover:text-white"
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
                "rounded-full px-4 py-1.5 text-sm transition-colors",
                activeTag === tag ? "bg-cyan-accent text-black" : "glass text-zinc-300 hover:text-white"
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
      {visible.length === 0 && <p className="py-16 text-center text-zinc-500">No posts found.</p>}

      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="glass rounded-full px-5 py-2 text-sm text-zinc-300 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="font-mono text-sm text-zinc-400">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="glass rounded-full px-5 py-2 text-sm text-zinc-300 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
