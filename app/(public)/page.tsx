import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { readingTime } from "@/lib/utils";
import Hero3D from "@/components/3d/Hero3D";
import Typewriter from "@/components/ui/Typewriter";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import ProjectCard from "@/components/ui/ProjectCard";
import PostCard from "@/components/blog/PostCard";
import SkillsMarquee from "@/components/ui/SkillsMarquee";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, featured, posts, skills] = await Promise.all([
    getSiteSettings(),
    prisma.project.findMany({ where: { featured: true }, orderBy: { order: "asc" }, take: 3 }),
    prisma.post.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: 2 }),
    prisma.skill.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <>
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <Hero3D variant="blob" className="absolute inset-0 hidden opacity-70 md:block" />
        <div className="relative z-10 text-center">
          <p className="font-mono text-sm text-cyan-accent">Hi, my name is</p>
          <h1 className="mt-4 text-5xl font-bold tracking-tight text-white md:text-7xl">{settings.siteName}</h1>
          <p className="mt-5 h-9 text-xl text-zinc-300 md:text-2xl">
            <Typewriter words={["Full-Stack Developer", "Open Source Builder", "CS Student at UET"]} />
          </p>
          <Link
            href="/projects"
            className="glow-indigo mt-10 inline-block rounded-full bg-indigo-accent px-8 py-3 font-medium text-white transition-colors hover:bg-indigo-500"
          >
            View My Work
          </Link>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-20">
          <Reveal>
            <SectionHeading title="Featured Projects" subtitle="A few things I'm proud of" />
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {featured.map((project, i) => (
              <Reveal key={project.id} delay={i * 0.1}>
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {skills.length > 0 && (
        <section className="py-12">
          <Reveal>
            <SectionHeading title="Skills" />
            <SkillsMarquee skills={skills.map((s) => s.name)} />
          </Reveal>
        </section>
      )}

      {posts.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-20">
          <Reveal>
            <SectionHeading title="Latest Writing" subtitle="From the blog" />
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post, i) => (
              <Reveal key={post.id} delay={i * 0.1}>
                <PostCard
                  post={{
                    slug: post.slug,
                    title: post.title,
                    excerpt: post.excerpt,
                    coverImage: post.coverImage,
                    tags: post.tags,
                    createdAt: post.createdAt.toISOString(),
                    readMins: readingTime(post.content),
                  }}
                />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
