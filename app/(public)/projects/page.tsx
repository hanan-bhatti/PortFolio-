import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Hero3D from "@/components/3d/Hero3D";
import ProjectsGrid from "@/components/ui/ProjectsGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
  description: "A showcase of my projects, experiments and open source work.",
};

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });

  return (
    <div className="mx-auto max-w-6xl px-4 pt-32 pb-20">
      <div className="relative mb-12">
        <Hero3D variant="icosahedron" className="absolute -top-16 right-0 hidden h-48 w-48 md:block" />
        <h1 className="text-4xl font-bold text-white md:text-5xl">
          <span className="gradient-text">Projects</span>
        </h1>
        <p className="mt-3 max-w-xl text-zinc-400">Things I have built — from full-stack apps to small experiments.</p>
      </div>
      <ProjectsGrid
        projects={projects.map((p) => ({
          slug: p.slug,
          title: p.title,
          description: p.description,
          techStack: p.techStack,
          coverImage: p.coverImage,
          liveUrl: p.liveUrl,
          githubUrl: p.githubUrl,
        }))}
      />
    </div>
  );
}
