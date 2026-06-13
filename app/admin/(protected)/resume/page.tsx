import { prisma } from "@/lib/prisma";
import { getResumeSettings } from "@/lib/resume";
import PageHeader from "@/components/admin/PageHeader";
import ResumeAdmin from "@/components/admin/ResumeAdmin";

export const dynamic = "force-dynamic";

export default async function AdminResumePage() {
  const [settings, education, certifications, experience, skills, downloads] = await Promise.all([
    getResumeSettings(),
    prisma.education.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    prisma.certification.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    prisma.experience.findMany({ orderBy: [{ order: "asc" }, { startDate: "desc" }] }),
    prisma.skill.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.resumeDownload.findMany({ orderBy: { downloadedAt: "desc" }, take: 200 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resume"
        crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Resume" }]}
        action={
          <a
            href="/resume"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 16px",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 500,
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
          >
            ↗ Preview Resume
          </a>
        }
      />
      <ResumeAdmin
        settings={settings}
        education={education}
        certifications={certifications}
        experience={experience.map((e) => ({
          ...e,
          startDate: e.startDate.toISOString(),
          endDate: e.endDate?.toISOString() ?? null,
        }))}
        skills={skills}
        downloads={downloads.map((d) => ({ ...d, downloadedAt: d.downloadedAt.toISOString() }))}
      />
    </div>
  );
}
