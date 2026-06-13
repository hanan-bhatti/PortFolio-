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
