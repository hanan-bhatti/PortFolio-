/**
 * @file app/(public)/projects/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - ProjectsPage (default): Main React component or function
 * - dynamic: Constant / Helper
 * - metadata: Constant / Helper
 */

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProjectsGrid from "@/components/ui/ProjectsGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
  description: "A showcase of my projects, experiments and open source work.",
};

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });

  return (
    <div
      className="w-full min-h-screen relative"
      style={{
        backgroundColor: "#0a0a0a",
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    >
      {/* Radial Gradient Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 10, 0.7) 70%, #0a0a0a 100%)",
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-32 pb-20">
        <div className="relative mb-12">
          <h1 className="font-syne font-extrabold text-[clamp(2rem,8vw,5.5rem)] leading-none text-white uppercase">
            PROJECTS
          </h1>
          <p className="mt-3 max-w-xl font-inter font-normal text-[14px] text-text-muted">
            {"Things I've built — from full-stack apps to small experiments."}
          </p>
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
    </div>
  );
}
