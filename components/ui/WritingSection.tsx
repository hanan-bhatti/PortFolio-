/**
 * @file components/ui/WritingSection.tsx
 * @description React component for WritingSection.tsx under the ui category.
 * 
 * @exports
 * - WritingSection (default): Main React component or function
 */

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

export default async function WritingSection() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  if (posts.length === 0) return null;

  return (
    <section className="bg-bg py-24 px-4 md:px-[8vw]">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex justify-between items-end pb-4 border-b border-border">
          <h2 className="font-syne font-bold text-[11px] tracking-[0.2em] text-text-muted uppercase">
            WRITING
          </h2>
          <Link
            href="/blog"
            className="font-syne font-bold text-[11px] tracking-[0.2em] text-amber hover:underline uppercase transition-colors"
          >
            All Posts →
          </Link>
        </div>

        {/* Grid Container */}
        {posts.length === 1 ? (
          <div className="w-full max-w-[640px] mx-auto">
            {posts.map((post) => (
              <div
                key={post.id}
                className="group bg-bg-surface border border-border flex flex-col justify-between transition-colors duration-200 hover:border-green"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  {post.coverImage ? (
                    <div className="relative w-full h-[200px] bg-black/20 overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-[200px] bg-bg-elevated flex items-center justify-center text-text-muted text-xs font-inter border-b border-border">
                      No cover image
                    </div>
                  )}

                  <div className="p-6">
                    {/* Date */}
                    <span className="font-inter text-text-muted text-[12px]">
                      {new Date(post.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>

                    {/* Title */}
                    <h3 className="font-syne font-bold text-[1.1rem] text-text-primary mt-2 group-hover:text-green transition-colors duration-200">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p
                      className="font-inter font-normal text-[13px] text-text-muted mt-2 line-clamp-2 overflow-hidden text-ellipsis"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {post.excerpt}
                    </p>
                  </div>
                </Link>

                {/* Tags */}
                <div className="px-6 pb-6 pt-0 flex flex-wrap gap-2">
                  {post.tags.map((tag, tagIdx) => (
                    <span
                      key={tagIdx}
                      className="font-inter font-medium text-[11px] text-amber hover:underline cursor-default"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <p style={{
              textAlign: 'center',
              marginTop: '2rem',
              fontSize: '13px',
              color: 'var(--text-muted)',
              fontFamily: 'Inter',
              letterSpacing: '0.05em'
            }}>
              More writing on the way.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="group bg-bg-surface border border-border flex flex-col justify-between transition-colors duration-200 hover:border-green"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  {post.coverImage ? (
                    <div className="relative w-full h-[200px] bg-black/20 overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-[200px] bg-bg-elevated flex items-center justify-center text-text-muted text-xs font-inter border-b border-border">
                      No cover image
                    </div>
                  )}

                  <div className="p-6">
                    {/* Date */}
                    <span className="font-inter text-text-muted text-[12px]">
                      {new Date(post.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>

                    {/* Title */}
                    <h3 className="font-syne font-bold text-[1.1rem] text-text-primary mt-2 group-hover:text-green transition-colors duration-200">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p
                      className="font-inter font-normal text-[13px] text-text-muted mt-2 line-clamp-2 overflow-hidden text-ellipsis"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {post.excerpt}
                    </p>
                  </div>
                </Link>

                {/* Tags */}
                <div className="px-6 pb-6 pt-0 flex flex-wrap gap-2">
                  {post.tags.map((tag, tagIdx) => (
                    <span
                      key={tagIdx}
                      className="font-inter font-medium text-[11px] text-amber hover:underline cursor-default"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
