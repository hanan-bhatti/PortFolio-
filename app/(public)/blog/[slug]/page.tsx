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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hanan-bhatti.site";
  const canonicalUrl = `${siteUrl}/blog/${slug}`;
  const title = `${post.title} | Hanan Bhatti`;
  
  // Truncate description dynamically to fit within 150-160 characters
  let description = post.excerpt;
  if (description.length > 160) {
    description = description.slice(0, 157) + "...";
  }

  // Optimize OG image size and dimensions using Next.js Image Optimizer
  const ogImageUrl = post.coverImage
    ? `${siteUrl}/_next/image?url=${encodeURIComponent(post.coverImage)}&w=1200&q=75`
    : `${siteUrl}/og-image.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      siteName: "Hanan Bhatti",
      url: canonicalUrl,
      title,
      description,
      locale: "en_US",
      publishedTime: post.createdAt.toISOString(),
      tags: post.tags,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${post.title} — ${description.slice(0, 50)}...`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@hananbhatti_",
      creator: "@hananbhatti_",
      images: [ogImageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || !post.published) notFound();

  await prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } });

  const { html, toc } = renderPostContent(post.content);

  // Fetch all published posts to determine prev/next navigation
  const allPosts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const showNav = allPosts.length > 1;

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
    <div className="min-h-screen bg-bg w-full flex flex-col justify-between" style={{ background: "#0a0a0a" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.excerpt,
            "image": post.coverImage || undefined,
            "datePublished": post.createdAt.toISOString(),
            "dateModified": post.updatedAt.toISOString(),
            "author": {
              "@type": "Person",
              "name": "Hanan Bhatti",
              "url": "https://hanan-bhatti.site"
            },
            "publisher": {
              "@type": "Person",
              "name": "Hanan Bhatti"
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://hanan-bhatti.site"}/blog/${slug}`
            }
          }),
        }}
      />
      <article className="w-full flex-grow pb-20">
        {/* Cover image or fallback hero */}
        <div className="relative w-full">
          {post.coverImage ? (
            <ParallaxCover src={post.coverImage} alt={post.title} />
          ) : (
            <div
              className="w-full h-[200px] md:h-[300px] relative border-b border-border"
              style={{
                backgroundColor: "var(--bg-elevated)",
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                `,
                backgroundSize: "30px 30px",
              }}
            />
          )}
          <Link
            href="/blog"
            className="absolute top-6 left-[max(2rem,5vw)] z-10 font-inter font-medium text-[13px] text-white/70 hover:text-amber transition-colors duration-200 flex items-center justify-center min-h-[44px] px-5 py-3 md:min-h-0 md:px-0 md:py-0"
          >
            ← Back to Blog
          </Link>
        </div>

        <div className="mx-auto px-5 md:px-4 w-full max-w-full md:max-w-6xl break-words [overflow-wrap:anywhere] [word-break:break-word]">
          <header className="mx-auto max-w-3xl pt-10 w-full">
            <h1 className="mt-4 text-[clamp(1.8rem,6vw,3rem)] md:text-[clamp(2.5rem,5vw,4.5rem)] font-bold text-white leading-tight w-full max-w-full">
              {post.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
              <span>{formatDate(post.createdAt)}</span>
              <span>·</span>
              <span>{readingTime(post.content)} min read</span>
              <span>·</span>
              <span>{post.views + 1} views</span>
            </div>
            
            {/* Tags - restyled per user request */}
            <div className="mt-4 flex flex-wrap gap-2 justify-start">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-inter font-semibold text-[11px] text-green border border-green-dim px-[10px] py-[3px] tracking-[0.08em] whitespace-nowrap bg-transparent uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-10 w-full max-w-full">
            <div
              className="prose-blog w-full max-w-full lg:max-w-3xl min-w-0"
              dangerouslySetInnerHTML={{ __html: html }}
            />
            <aside className="hidden lg:block w-60 shrink-0">
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

      {/* Bottom Navigation */}
      {showNav && (prevPost || nextPost) && (
        <nav className="w-full border-t border-border py-8 px-[max(2rem,5vw)] flex justify-between items-center bg-transparent mt-20">
          {prevPost ? (
            <Link
              href={`/blog/${prevPost.slug}`}
              className="font-inter font-medium text-[13px] text-text-muted hover:text-amber transition-colors duration-200"
            >
              ← Previous Post
            </Link>
          ) : null}
          {nextPost ? (
            <Link
              href={`/blog/${nextPost.slug}`}
              className="font-inter font-medium text-[13px] text-text-muted hover:text-amber transition-colors duration-200 ml-auto"
            >
              Next Post →
            </Link>
          ) : null}
        </nav>
      )}
    </div>
  );
}
