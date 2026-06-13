import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResumeSettings } from "@/lib/resume";
import { getSiteSettings } from "@/lib/settings";
import ResumePageClient from "@/components/resume/ResumePageClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [rs, ss] = await Promise.all([getResumeSettings(), getSiteSettings()]);
  const name = rs.resume_name || ss.siteName;
  const title = rs.resume_title || ss.tagline;
  return {
    title: `Resume — ${name}`,
    description: rs.resume_summary || `Resume of ${name}, ${title}`,
  };
}

export default async function ResumePage() {
  const [settings, education, certifications, experience, skills, projects] = await Promise.all([
    getResumeSettings(),
    prisma.education.findMany({ orderBy: [{ order: "asc" }] }),
    prisma.certification.findMany({ orderBy: [{ order: "asc" }] }),
    prisma.experience.findMany({ orderBy: [{ order: "asc" }, { startDate: "desc" }] }),
    prisma.skill.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.project.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] }),
  ]);

  if (settings.resume_enabled === "false") {
    notFound();
  }

  const totalDownloads = await prisma.resumeDownload.count();

  return (
    <ResumePageClient
      settings={settings}
      education={education}
      certifications={certifications}
      experience={experience.map((e) => ({
        ...e,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate?.toISOString() ?? null,
      }))}
      skills={skills}
      projects={projects}
      totalDownloads={totalDownloads}
    />
  );
}
