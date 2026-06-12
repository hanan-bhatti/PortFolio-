import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { readingTime } from "@/lib/utils";
import Hero3D from "@/components/3d/Hero3D";
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
    <div className="mx-auto max-w-6xl px-4 pt-32 pb-20">
      <div className="relative mb-12 flex h-40 items-center justify-center md:h-56">
        <Hero3D variant="blogtext" className="absolute inset-0 hidden md:block" />
        <h1 className="text-5xl font-bold gradient-text md:hidden">Blog</h1>
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
