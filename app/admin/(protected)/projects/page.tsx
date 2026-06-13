import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import ProjectsManager from "@/components/admin/ProjectsManager";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });

  return (
    <div>
      <PageHeader
        title="Projects"
        crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Projects" }]}
        action={
          <Link href="/admin/projects/new" className="border border-amber bg-amber px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-black hover:bg-amber/90 transition-all">
            + New Project
          </Link>
        }
      />
      <p className="mb-4 text-xs text-zinc-500">Drag rows to change the display order.</p>
      <Suspense fallback={<div className="font-mono text-xs text-zinc-500">Loading projects...</div>}>
        <ProjectsManager
          initial={projects.map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            featured: p.featured,
            techStack: p.techStack,
          }))}
        />
      </Suspense>
    </div>
  );
}
