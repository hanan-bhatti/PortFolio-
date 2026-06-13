import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExperienceForm from "@/components/admin/ExperienceForm";

interface EditExperiencePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExperiencePage({ params }: EditExperiencePageProps) {
  const { id } = await params;

  const experience = await prisma.experience.findUnique({
    where: { id },
  });

  if (!experience) {
    notFound();
  }

  // Ensure dates are serialized safely for the client components
  return (
    <ExperienceForm
      experience={{
        ...experience,
        startDate: experience.startDate.toISOString(),
        endDate: experience.endDate ? experience.endDate.toISOString() : null,
      }}
    />
  );
}
