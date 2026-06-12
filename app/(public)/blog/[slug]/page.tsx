import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, readingTime } from "@/lib/utils";
import { renderPostContent } from "@/lib/tiptap-html";
import ParallaxCover from "@/components/blog/ParallaxCover";
import Toc from "@/components/blog/Toc";
import PostCard from "@/components/blog/PostCard";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || !post.published) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
      publishedTime: post.createdAt.toISOString(),
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || !post.published) notFound();

  await prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } });

  const { html, toc } = renderPostContent(post.content);

  const related = await prisma.post.findMany({
    where: {
      published: true,
      id: { not: post.id },
      tags: { hasSome: post.tags },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <article className="pb-20">
      {post.coverImage ? (
        <ParallaxCover src={post.coverImage} alt={post.title} />
      ) : (
        <div className="h-32" />
      )}

      <div className="mx-auto max-w-6xl px-4">
        <header className="mx-auto max-w-3xl pt-10">
          <Link href="/blog" className="text-sm text-cyan-accent hover:underline">
            ← Back to Blog
          </Link>
          <h1 className="mt-4 text-4xl font-bold text-white md:text-5xl">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            <span>{formatDate(post.createdAt)}</span>
            <span>·</span>
            <span>{readingTime(post.content)} min read</span>
            <span>·</span>
            <span>{post.views + 1} views</span>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li key={tag} className="rounded-full bg-cyan-accent/10 px-2.5 py-0.5 text-xs text-cyan-300">
                #{tag}
              </li>
            ))}
          </ul>
        </header>

        <div className="mt-10 flex gap-10">
          <div
            className="prose-blog mx-auto max-w-3xl min-w-0 flex-1"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <aside className="w-64 shrink-0">
            <Toc items={toc} />
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mx-auto mt-20 max-w-5xl">
            <h2 className="mb-6 text-2xl font-bold text-white">
              Related <span className="gradient-text">Posts</span>
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <PostCard
                  key={r.id}
                  post={{
                    slug: r.slug,
                    title: r.title,
                    excerpt: r.excerpt,
                    coverImage: r.coverImage,
                    tags: r.tags,
                    createdAt: r.createdAt.toISOString(),
                    readMins: readingTime(r.content),
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
