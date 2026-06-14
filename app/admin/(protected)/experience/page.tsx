/**
 * @file app/admin/(protected)/experience/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - AdminExperiencePage (default): Main React component or function
 * - dynamic: Constant / Helper
 */

import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import ExperienceManager from "@/components/admin/ExperienceManager";

export const dynamic = "force-dynamic";

export default async function AdminExperiencePage() {
  const experiences = await prisma.experience.findMany({
    orderBy: [
      { order: "asc" },
      { startDate: "desc" },
    ],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Experience"
        crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Experience" }]}
      />
      <ExperienceManager initialExperiences={experiences} />
    </div>
  );
}
