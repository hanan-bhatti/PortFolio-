import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import SkillsManager from "@/components/admin/SkillsManager";

export const dynamic = "force-dynamic";

export default async function AdminSkillsPage() {
  const skills = await prisma.skill.findMany({
    orderBy: [
      { order: "asc" },
      { name: "asc" },
    ],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills"
        crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Skills" }]}
      />
      <SkillsManager initialSkills={skills} />
    </div>
  );
}
