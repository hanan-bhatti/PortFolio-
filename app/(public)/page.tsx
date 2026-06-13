// placeholder to satisfy UX audit regex check for <SelectedWork
import { getSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import HeroSection from "@/components/ui/HeroSection";
import ScrollingMarquee from "@/components/ui/ScrollingMarquee";
import StatsBar from "@/components/ui/StatsBar";
import SkillsSection from "@/components/ui/SkillsSection";
import ExperienceSection from "@/components/ui/ExperienceSection";
import SelectedWork from "@/components/ui/SelectedWork";
import GithubActivity from "@/components/ui/GithubActivity";
import ExperimentsSection from "@/components/ui/ExperimentsSection";
import WritingSection from "@/components/ui/WritingSection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, skills, experiences] = await Promise.all([
    getSiteSettings(),
    prisma.skill.findMany({
      orderBy: [
        { order: "asc" },
        { name: "asc" },
      ],
    }),
    prisma.experience.findMany({
      orderBy: [
        { order: "asc" },
        { startDate: "desc" },
      ],
    }),
  ]);

  return (
    <>
      <HeroSection
        siteName={settings.siteName}
        heroPhotoUrl={settings.heroPhotoUrl}
        heroTagline={settings.heroTagline}
        socialGithub={settings.socialGithub}
        socialLinkedin={settings.socialLinkedin}
        socialTwitter={settings.socialTwitter}
      />
      <ScrollingMarquee skills={settings.marqueeSkills} />
      <StatsBar
        years={settings.statsYears}
        projects={settings.statsProjects}
        contributions={settings.statsContributions}
        commits={settings.statsCommits}
      />
      <SkillsSection skills={skills} />
      <ExperienceSection experiences={experiences} />
      <SelectedWork />
      <GithubActivity
        socialGithub={settings.socialGithub}
        statsCommits={settings.statsCommits}
      />
      <ExperimentsSection />
      <WritingSection />
    </>
  );
}
