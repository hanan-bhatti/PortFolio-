/**
 * @file app/admin/(protected)/projects/[id]/edit/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - EditProjectPage (default): Main React component or function
 * - dynamic: Constant / Helper
 */

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import ProjectForm from "@/components/admin/ProjectForm";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  return (
    <div>
      <PageHeader
        title="Edit Project"
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Projects", href: "/admin/projects" },
          { label: project.title },
        ]}
      />
      <ProjectForm project={project} />
    </div>
  );
}
