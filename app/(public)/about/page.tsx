import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import Hero3D from "@/components/3d/Hero3D";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import RadialSkill from "@/components/ui/RadialSkill";
import Timeline from "@/components/ui/Timeline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description: "About me, my skills and my experience.",
};

export default async function AboutPage() {
  const [settings, skills, experiences] = await Promise.all([
    getSiteSettings(),
    prisma.skill.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] }),
    prisma.experience.findMany({ orderBy: [{ order: "asc" }, { startDate: "desc" }] }),
  ]);

  const grouped = skills.reduce<Record<string, typeof skills>>((acc, skill) => {
    const list = acc[skill.category] ?? [];
    list.push(skill);
    acc[skill.category] = list;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl px-4 pt-32 pb-20">
      <section className="flex flex-col items-center gap-10 md:flex-row md:items-start">
        <div className="relative shrink-0">
          <div className="blob-ring absolute -inset-3" aria-hidden />
          <Hero3D variant="particles" className="absolute -inset-16 hidden md:block" />
          <div className="relative h-44 w-44 overflow-hidden rounded-full border border-white/10 bg-surface-light">
            {settings.profilePhotoUrl ? (
              <Image src={settings.profilePhotoUrl} alt={settings.siteName} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-5xl font-bold text-white/20">
                {settings.siteName.charAt(0)}
              </div>
            )}
          </div>
        </div>
        <Reveal>
          <h1 className="text-4xl font-bold text-white">
            About <span className="gradient-text">Me</span>
          </h1>
          <p className="mt-5 leading-relaxed whitespace-pre-line text-zinc-300">
            {settings.aboutBio || "Add your bio in the admin settings to display it here."}
          </p>
        </Reveal>
      </section>

      {skills.length > 0 && (
        <section className="mt-24">
          <Reveal>
            <SectionHeading title="Skills" subtitle="Tools and technologies I work with" />
          </Reveal>
          <div className="space-y-12">
            {Object.entries(grouped).map(([category, items]) => (
              <Reveal key={category}>
                <h3 className="mb-5 font-mono text-sm tracking-widest text-cyan-accent uppercase">{category}</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                  {items.map((skill) => (
                    <RadialSkill key={skill.id} name={skill.name} level={skill.level} />
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {experiences.length > 0 && (
        <section className="mt-24">
          <Reveal>
            <SectionHeading title="Experience" subtitle="Where I've been" />
          </Reveal>
          <Timeline
            entries={experiences.map((e) => ({
              id: e.id,
              role: e.role,
              company: e.company,
              location: e.location,
              startDate: e.startDate.toISOString(),
              endDate: e.endDate ? e.endDate.toISOString() : null,
              current: e.current,
              description: e.description,
            }))}
          />
        </section>
      )}
    </div>
  );
}
