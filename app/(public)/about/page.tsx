/**
 * @file app/(public)/about/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - AboutPage (default): Main React component or function
 * - dynamic: Constant / Helper
 * - metadata: Constant / Helper
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getSiteSettings, getAboutSettings } from "@/lib/settings";
import {
  SiNextdotjs,
  SiReact,
  SiTypescript,
  SiTailwindcss,
  SiFramer,
  SiNestjs,
  SiNodedotjs,
  SiExpress,
  SiPostgresql,
  SiRedis,
  SiClickhouse,
  SiPrisma,
  SiMongodb,
  SiDocker,
  SiApachekafka,
  SiGit,
  SiPnpm,
  SiTurborepo,
  SiMinio,
  SiSharp,
  SiCplusplus,
  SiGnubash,
  SiJavascript,
  SiNginx,
  SiTailscale,
} from "react-icons/si";

const techIcons: Record<string, React.ReactNode> = {
  "Next.js": <SiNextdotjs />,
  "React": <SiReact />,
  "TypeScript": <SiTypescript />,
  "Tailwind CSS": <SiTailwindcss />,
  "Framer Motion": <SiFramer />,
  "NestJS": <SiNestjs />,
  "Node.js": <SiNodedotjs />,
  "Express": <SiExpress />,
  "PostgreSQL": <SiPostgresql />,
  "Redis": <SiRedis />,
  "ClickHouse": <SiClickhouse />,
  "Prisma": <SiPrisma />,
  "MongoDB": <SiMongodb />,
  "Docker": <SiDocker />,
  "Kafka": <SiApachekafka />,
  "Git": <SiGit />,
  "pnpm": <SiPnpm />,
  "Turborepo": <SiTurborepo />,
  "MinIO": <SiMinio />,
  "C#": <SiSharp />,
  "C++": <SiCplusplus />,
  "Bash": <SiGnubash />,
  "JavaScript": <SiJavascript />,
  "Nginx": <SiNginx />,
  "Tailscale": <SiTailscale />,
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about me, my tech stack, and what I do.",
};

interface DomainBlock {
  domain: string;
  skills: string[];
}

function SectionLabel({ text }: { text: string }) {
  return (
    <span className="font-inter font-semibold text-[11px] tracking-[0.2em] text-text-muted mb-4 block uppercase text-left">
      {text}
    </span>
  );
}

const MarkdownComponents = {
  p: ({ children }: any) => (
    <p className="font-inter font-normal text-[15px] leading-[1.9] text-text-primary mb-[1.5rem] text-left">
      {children}
    </p>
  ),
  h1: ({ children }: any) => (
    <h2 className="font-syne font-bold text-3xl text-white mt-8 mb-4 uppercase text-left">
      {children}
    </h2>
  ),
  h2: ({ children }: any) => (
    <h2 className="font-syne font-bold text-2xl text-amber mt-8 mb-3 uppercase text-left">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="font-syne font-bold text-xl text-amber mt-6 mb-2 uppercase text-left">
      {children}
    </h3>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      className="text-green hover:underline font-medium"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc pl-6 mb-[1.5rem] space-y-2 text-left text-zinc-300">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal pl-6 mb-[1.5rem] space-y-2 text-left text-zinc-300">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="font-inter text-[15px] leading-[1.9] text-text-primary">
      {children}
    </li>
  ),
};

function formatCtaLink(val: string): string {
  const trimmed = val.trim();
  if (trimmed.includes("@") && !trimmed.includes("http") && !trimmed.startsWith("mailto:")) {
    return `mailto:${trimmed}`;
  }
  return trimmed;
}

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const about = await getAboutSettings();

  const siteName = settings.siteName || "Hanan";
  const firstName = siteName.split(" ")[0] || "Hanan";

  const hasAvatar = !!about.about_avatar_url;

  // Parse stack JSON
  let stackList: DomainBlock[] = [];
  try {
    const parsed = JSON.parse(about.about_stack);
    if (Array.isArray(parsed)) {
      stackList = parsed;
    }
  } catch {
    stackList = [];
  }

  return (
    <div className="bg-bg min-h-screen text-left" style={{ background: "#0a0a0a" }}>
      
      {/* SECTION 1: Hero */}
      <section className="relative min-h-[70vh] flex items-center pt-24 pb-12 w-full max-w-6xl mx-auto px-4 md:px-0">
        <div className={`w-full grid gap-8 items-center ${
          hasAvatar ? "grid-cols-1 md:grid-cols-[55%_45%]" : "grid-cols-1"
        }`}>
          {/* Left Side */}
          <div className="flex flex-col justify-center text-left">
            <SectionLabel text="ABOUT" />
            <h1 className="font-syne font-extrabold text-[clamp(3rem,7vw,5.5rem)] leading-[0.95] text-white">
              I&apos;m <span className="text-amber">{firstName}</span>.
            </h1>
            {about.about_hero_tagline && (
              <p className="mt-6 font-inter font-normal text-[16px] text-text-muted leading-[1.7] max-w-[480px]">
                {about.about_hero_tagline}
              </p>
            )}
            {about.about_cta_text && about.about_cta_email && (
              <div className="mt-8">
                <Link
                  href={formatCtaLink(about.about_cta_email)}
                  className="inline-flex items-center justify-center font-inter font-semibold text-[14px] bg-amber text-black px-7 py-3.5 transition-all active:scale-[0.98] select-none uppercase hover:bg-amber/90 whitespace-nowrap min-w-[140px]"
                >
                  {about.about_cta_text} →
                </Link>
              </div>
            )}
          </div>

          {/* Right Side (Avatar) */}
          {hasAvatar && (
            <div className="relative flex items-center justify-center w-full min-h-[300px] md:min-h-[400px]">
              {/* Subtle accent box behind */}
              <div className="absolute top-[10%] left-[10%] w-[80%] h-[80%] bg-amber/5 z-0" />
              <div className="relative w-full h-[300px] md:h-[400px] max-h-[400px] z-10">
                <Image
                  src={about.about_avatar_url}
                  alt={siteName}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: The Story */}
      {about.about_story && (
        <section className="bg-bg-surface py-20 px-4 md:px-0 border-t border-b border-border">
          <div className="max-w-[760px] mx-auto">
            <SectionLabel text="THE STORY" />
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
              {about.about_story}
            </ReactMarkdown>
          </div>
        </section>
      )}

      {/* SECTION 3: Tech Stack */}
      {stackList.length > 0 && (
        <section className="bg-bg py-20 px-4 md:px-0">
          <div className="max-w-[760px] mx-auto">
            <SectionLabel text="STACK" />
            <div className="space-y-1">
              {stackList.map((block, i) => (
                <div
                  key={i}
                  className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 py-5 border-b border-border last:border-b-0"
                >
                  <span className="font-syne font-bold text-[13px] tracking-[0.1em] text-text-muted uppercase min-w-[140px] shrink-0 text-left">
                    {block.domain}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {block.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="group inline-flex items-center gap-[6px] border border-border px-[12px] py-[5px] text-[12px] text-text-muted font-inter hover:border-amber hover:text-amber transition-colors duration-150 whitespace-nowrap"
                      >
                        {techIcons[skill] && (
                          <span className="inline-flex text-[14px] text-green group-hover:text-amber transition-colors duration-150">
                            {techIcons[skill]}
                          </span>
                        )}
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: Currently */}
      {about.about_currently && (
        <section className="bg-bg-surface py-20 px-4 md:px-0 border-t border-b border-border">
          <div className="max-w-[760px] mx-auto">
            <SectionLabel text="CURRENTLY" />
            <div className="border-l-[3px] border-amber pl-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                {about.about_currently}
              </ReactMarkdown>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 5: Beyond Code */}
      {about.about_beyond_code && (
        <section className="bg-bg py-20 px-4 md:px-0">
          <div className="max-w-[760px] mx-auto">
            <SectionLabel text="BEYOND CODE" />
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
              {about.about_beyond_code}
            </ReactMarkdown>
          </div>
        </section>
      )}

      {/* SECTION 6: CTA Banner */}
      {about.about_cta_text && about.about_cta_email && (
        <section className="bg-bg-elevated border-t border-b border-border py-16 px-4 md:px-0 text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <h2 className="font-syne font-extrabold text-[clamp(2rem,5vw,3.5rem)] text-white uppercase leading-tight">
              {about.about_cta_text}
            </h2>
            <div className="mt-8">
              <Link
                href={formatCtaLink(about.about_cta_email)}
                className="inline-flex items-center justify-center font-inter font-semibold text-[14px] bg-amber text-black px-7 py-3.5 transition-all active:scale-[0.98] select-none uppercase hover:bg-amber/90 whitespace-nowrap min-w-[140px]"
              >
                Get in touch →
              </Link>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
