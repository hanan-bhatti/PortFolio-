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

  return (
    <article className="mx-auto max-w-4xl px-4 pt-32 pb-20">
      <Link href="/projects" className="text-sm text-cyan-accent hover:underline">
        ← Back to Projects
      </Link>
      <h1 className="mt-4 text-4xl font-bold text-white md:text-5xl">{project.title}</h1>
      <p className="mt-4 text-lg text-zinc-400">{project.description}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        {project.liveUrl ? (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="glow-indigo rounded-full bg-indigo-accent px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            View Live ↗
          </a>
        ) : null}
        {project.githubUrl ? (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="glass rounded-full px-6 py-2 text-sm font-medium text-zinc-200 hover:text-white"
          >
            Source on GitHub ↗
          </a>
        ) : null}
      </div>

      {project.coverImage ? (
        <div className="relative mt-10 h-72 w-full overflow-hidden rounded-2xl md:h-96">
          <Image src={project.coverImage} alt={project.title} fill className="object-cover" priority />
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-white">Tech Stack</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {project.techStack.map((tech) => (
            <li key={tech} className="rounded-full bg-indigo-accent/15 px-3 py-1 text-sm text-indigo-300">
              {tech}
            </li>
          ))}
        </ul>
      </section>

      {project.longDesc ? (
        <section className="mt-10 space-y-4 leading-relaxed text-zinc-300">
          {project.longDesc.split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </section>
      ) : null}
    </article>
  );
}
