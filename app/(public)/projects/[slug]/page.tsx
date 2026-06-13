import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) return { title: "Project not found" };
  return {
    title: project.title,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      images: project.coverImage ? [project.coverImage] : [],
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) notFound();

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
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center font-inter font-semibold text-[14px] border border-amber bg-transparent text-text-primary hover:bg-amber hover:text-black px-6 py-3 transition-colors duration-200 uppercase whitespace-nowrap self-start md:self-auto cursor-pointer"
            >
              Source on GitHub ↗
            </a>
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
          <section className="font-inter font-normal text-[15px] leading-[1.8] text-text-primary text-left space-y-6">
            {project.longDesc.split(/\n{2,}/).map((para, i) => {
              const cleanPara = para.trim();
              if (cleanPara.startsWith("### ")) {
                return (
                  <h3 key={i} className="font-syne font-bold text-lg text-amber mt-6 mb-2 uppercase">
                    {cleanPara.replace("### ", "")}
                  </h3>
                );
              }
              if (cleanPara.startsWith("## ")) {
                return (
                  <h2 key={i} className="font-syne font-bold text-xl text-amber mt-8 mb-3 uppercase">
                    {cleanPara.replace("## ", "")}
                  </h2>
                );
              }
              return (
                <p key={i} className="mb-[1.5rem]">
                  {para}
                </p>
              );
            })}
          </section>
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
