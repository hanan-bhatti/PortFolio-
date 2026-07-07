/**
 * @file app/(public)/blog/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - BlogPage (default): Main React component or function
 * - dynamic: Constant / Helper
 * - metadata: Constant / Helper
 */

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { readingTime } from "@/lib/utils";
import BlogIndex from "@/components/blog/BlogIndex";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "Articles on web development, open source and things I learn.",
};

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 md:pt-32 pb-20">
      <div className="relative mb-12 flex flex-col items-start text-left">
        <span className="font-inter font-semibold text-[11px] tracking-[0.2em] text-text-muted mb-4 uppercase">
          WRITING
        </span>
        <h1 className="font-syne font-extrabold text-[clamp(3rem,7vw,5.5rem)] leading-none text-white uppercase">
          The <span className="text-amber">Blog</span>
        </h1>
        <p className="mt-4 font-inter font-normal text-[14px] text-text-muted max-w-[480px]">
          Articles on web development, software engineering, and modern tech.
        </p>
      </div>
      <BlogIndex
        posts={posts.map((post) => ({
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          coverImage: post.coverImage,
          tags: post.tags,
          createdAt: post.createdAt.toISOString(),
          readMins: readingTime(post.content),
        }))}
      />
    </div>
  );
}
