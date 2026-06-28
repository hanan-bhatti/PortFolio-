/**
 * @file app/(public)/resume/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - ResumePage (default): Main React component or function
 * - dynamic: Constant / Helper
 * - generateMetadata(): Function
 */

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResumeSettings } from "@/lib/resume";
import { getSiteSettings } from "@/lib/settings";
import ResumePageClient from "@/components/resume/ResumePageClient";
import type { Metadata } from "next";
import { extractTwitterUsername } from "@/lib/utils";
import { getOrCreateShortLink } from "@/lib/shortener";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [rs, ss] = await Promise.all([getResumeSettings(), getSiteSettings()]);
  const name = rs.resume_name || ss.siteName;
  const titleText = rs.resume_title || ss.tagline;
  const description = rs.resume_summary || `Resume of ${name}, ${titleText}`;

  const twitterHandle = extractTwitterUsername(ss.socialTwitter);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hanan-bhatti.site").replace(/\/$/, "");
  const canonicalUrl = `${siteUrl}/resume`;
  const pageTitle = `Resume — ${name}`;

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      siteName: ss.siteName,
      url: canonicalUrl,
      title: pageTitle,
      description,
      locale: "en_US",
      images: [
        {
          url: `${siteUrl}/_next/image?url=${encodeURIComponent("/og-image.png")}&w=1200&q=75`,
          width: 1200,
          height: 630,
          alt: `${name} — Resume`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      site: twitterHandle,
      creator: twitterHandle,
      images: [`${siteUrl}/_next/image?url=${encodeURIComponent("/og-image.png")}&w=1200&q=75`],
    },
  };
}

export default async function ResumePage() {
  const [settings, siteSettings, education, certifications, experience, skills, projects] = await Promise.all([
    getResumeSettings(),
    getSiteSettings(),
    prisma.education.findMany({ orderBy: [{ order: "asc" }] }),
    prisma.certification.findMany({ orderBy: [{ order: "asc" }] }),
    prisma.experience.findMany({ orderBy: [{ order: "asc" }, { startDate: "desc" }] }),
    prisma.skill.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.project.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] }),
  ]);

  if (settings.resume_enabled === "false") {
    notFound();
  }

  const [githubCode, linkedinCode, twitterCode] = await Promise.all([
    siteSettings.socialGithub ? getOrCreateShortLink(`${siteSettings.socialGithub}?utm_source=portfolio&utm_medium=resume`, "link") : null,
    siteSettings.socialLinkedin ? getOrCreateShortLink(`${siteSettings.socialLinkedin}?utm_source=portfolio&utm_medium=resume`, "link") : null,
    siteSettings.socialTwitter ? getOrCreateShortLink(`${siteSettings.socialTwitter}?utm_source=portfolio&utm_medium=resume`, "link") : null,
  ]);

  const totalDownloads = await prisma.resumeDownload.count();

  return (
    <ResumePageClient
      settings={{
        ...settings,
        social_github: siteSettings.socialGithub || "",
        social_linkedin: siteSettings.socialLinkedin || "",
        social_twitter: siteSettings.socialTwitter || "",
        social_github_link: githubCode ? `/s/${githubCode}` : "",
        social_linkedin_link: linkedinCode ? `/s/${linkedinCode}` : "",
        social_twitter_link: twitterCode ? `/s/${twitterCode}` : "",
      }}
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
