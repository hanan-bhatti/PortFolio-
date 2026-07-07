/**
 * @file app/(public)/projects/[slug]/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - ProjectDetailPage (default): Main React component or function
 * - generateMetadata(): Function
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { extractTwitterUsername } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getOrCreateShortLink } from "@/lib/shortener";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [project, settings] = await Promise.all([
    prisma.project.findUnique({ where: { slug } }),
    getSiteSettings(),
  ]);
  
  if (!project) return { title: "Project not found" };

  const twitterHandle = extractTwitterUsername(settings.socialTwitter);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hanan-bhatti.site").replace(/\/$/, "");
  const canonicalUrl = `${siteUrl}/projects/${slug}`;
  const title = `${project.title} — Open Source Project`;
  const description = project.description;

  // Optimize OG image size and dimensions using Next.js Image Optimizer
  const ogImageUrl = project.coverImage
    ? `${siteUrl}/_next/image?url=${encodeURIComponent(project.coverImage)}&w=1200&q=75`
    : `${siteUrl}/og-image.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      url: canonicalUrl,
      title,
      description,
      locale: "en_US",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${project.title} — ${description.slice(0, 50)}...`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: twitterHandle,
      creator: twitterHandle,
      images: [ogImageUrl],
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) notFound();

  const gitShortCode = project.githubUrl
    ? await getOrCreateShortLink(`${project.githubUrl}?utm_source=project_detail`, "link", undefined, project.id)
    : null;

  const liveShortCode = project.liveUrl
    ? await getOrCreateShortLink(`${project.liveUrl}?utm_source=project_detail`, "link", undefined, project.id)
    : null;

  const trackedGithubUrl = gitShortCode ? `/s/${gitShortCode}` : project.githubUrl;
  const trackedLiveUrl = liveShortCode ? `/s/${liveShortCode}` : project.liveUrl;

  // Fetch all projects to determine previous and next project links
  const allProjects = await prisma.project.findMany({
    select: { slug: true, title: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  const currentIndex = allProjects.findIndex((p) => p.slug === slug);
  const prevProject = currentIndex > 0 ? allProjects[currentIndex - 1] : null;
  const nextProject = currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-bg w-full flex flex-col justify-between" style={{ background: "#0a0a0a" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": project.title,
            "description": project.description,
            "applicationCategory": "DeveloperApplication",
            "operatingSystem": "All",
            "downloadUrl": project.githubUrl || undefined,
            "author": {
              "@type": "Person",
              "name": "Hanan Bhatti",
              "url": "https://hanan-bhatti.site"
            }
          }),
        }}
      />
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] overflow-hidden bg-bg-surface border-b border-border">
        {project.coverImage ? (
          <Image
            src={project.coverImage}
            alt={project.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-bg-elevated flex items-center justify-center text-[10vw] font-syne font-extrabold text-white/5 uppercase">
            {project.title.charAt(0)}
          </div>
        )}
        <div
          className="absolute inset-0 z-1 pointer-events-none"
          style={{
            background: "linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.4) 60%, rgba(10,10,10,0) 100%)",
          }}
        />
        <Link
          href="/projects"
          className="absolute top-6 left-[max(2rem,5vw)] z-10 font-inter font-medium text-[13px] text-white/70 hover:text-amber transition-colors duration-200"
        >
          ← Back to Projects
        </Link>
        <h1 className="absolute bottom-8 left-[max(2rem,5vw)] z-10 font-syne font-extrabold text-[clamp(2.5rem,6vw,5rem)] leading-[1.1] text-white uppercase max-w-[90%] text-left">
          {project.title}
        </h1>
      </section>

      {/* Content Section */}
      <article className="w-full max-w-[860px] mx-auto px-[max(2rem,5vw)] py-12 flex-grow">
        {/* Top Meta Row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <p className="font-inter font-normal text-[16px] text-text-muted max-w-[560px] text-left leading-relaxed">
            {project.description}
          </p>
          {(project.liveUrl || project.githubUrl) && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto self-start md:self-auto">
              {project.liveUrl && (
                <a
                  href={trackedLiveUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center font-inter font-semibold text-[14px] border border-amber bg-amber text-black hover:bg-transparent hover:text-white px-6 py-3 transition-colors duration-200 uppercase whitespace-nowrap min-h-[44px] cursor-pointer"
                >
                  Live Demo ↗
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={trackedGithubUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center font-inter font-semibold text-[14px] text-amber hover:text-white hover:underline px-4 py-3 transition-colors duration-200 uppercase whitespace-nowrap min-h-[44px] cursor-pointer"
                >
                  Source on GitHub ↗
                </a>
              )}
            </div>
          )}
        </div>

        {/* Tech Stack */}
        <div className="mt-8">
          <span className="font-inter font-semibold text-[11px] tracking-[0.15em] text-text-muted mb-3 block text-left uppercase">
            TECH STACK
          </span>
          <div className="flex flex-wrap gap-2 justify-start">
            {project.techStack.map((tech) => (
              <span
                key={tech}
                className="font-inter font-medium text-[11px] text-green border border-green-dim px-[10px] py-[3px] tracking-[0.08em] whitespace-nowrap"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-border my-8" />

        {/* Long Description / Content */}
        {project.longDesc && (
          <div className="font-inter font-normal text-[15px] leading-[1.8] text-text-primary text-left">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h2 className="font-syne font-extrabold text-2xl text-amber mt-10 mb-4 uppercase">
                    {children}
                  </h2>
                ),
                h2: ({ children }) => (
                  <h2 className="font-syne font-bold text-xl text-amber mt-8 mb-3 uppercase">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="font-syne font-bold text-lg text-amber mt-6 mb-2 uppercase">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-4">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 space-y-2 my-4">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 space-y-2 my-4">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="font-inter text-[15px] text-text-primary leading-[1.7]">
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-white">
                    {children}
                  </strong>
                ),
                code: ({ children, className }) => {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code className="bg-[#1a1a1a] text-[#16A34A] border border-[#262626] px-1.5 py-0.5 font-mono text-xs rounded-none">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <pre className="bg-[#22241d] border border-[#262626]/40 p-4 overflow-x-auto my-4 rounded-none font-mono text-xs text-zinc-300">
                      <code>{children}</code>
                    </pre>
                  );
                },
              }}
            >
              {project.longDesc}
            </ReactMarkdown>
          </div>
        )}
      </article>

      {/* Bottom Navigation */}
      <nav className="w-full border-t border-border py-8 px-[max(2rem,5vw)] flex justify-between items-center bg-bg">
        {prevProject ? (
          <Link
            href={`/projects/${prevProject.slug}`}
            className="font-inter font-medium text-[13px] text-text-muted hover:text-amber transition-colors duration-200"
          >
            ← Previous Project
          </Link>
        ) : (
          <span />
        )}
        {nextProject ? (
          <Link
            href={`/projects/${nextProject.slug}`}
            className="font-inter font-medium text-[13px] text-text-muted hover:text-amber transition-colors duration-200"
          >
            Next Project →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
