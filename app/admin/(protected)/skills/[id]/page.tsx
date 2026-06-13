import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SkillForm from "@/components/admin/SkillForm";

interface EditSkillPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSkillPage({ params }: EditSkillPageProps) {
  const { id } = await params;

  const skill = await prisma.skill.findUnique({
    where: { id },
  });

  if (!skill) {
    notFound();
  }

  return <SkillForm skill={skill} />;
}
