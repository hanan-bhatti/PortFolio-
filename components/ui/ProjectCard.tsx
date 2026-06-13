import Image from "next/image";
import Link from "next/link";

export interface ProjectCardData {
  slug: string;
  title: string;
  description: string;
  techStack: string[];
  coverImage: string | null;
  liveUrl: string | null;
  githubUrl: string | null;
}

export default function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <div className="bg-bg-surface border border-border overflow-hidden rounded-none transition-all duration-200 hover:border-amber hover:-translate-y-1 flex flex-col justify-between h-full">
      <Link href={`/projects/${project.slug}`} className="block">
        {/* Cover Image Area */}
        <div className="relative h-[220px] w-full overflow-hidden bg-bg-elevated">
          {project.coverImage ? (
            <Image
              src={project.coverImage}
              alt={project.title}
              fill
              className="object-cover grayscale-[20%]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bg-elevated text-4xl font-bold text-white/10 uppercase font-syne">
              {project.title.charAt(0)}
            </div>
          )}

          {/* Dark Gradient Overlay */}
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0) 100%)",
            }}
          />

          {/* Project Info on Top of Gradient */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex flex-col gap-1 text-left">
            <h3 className="font-syne font-bold text-[1.1rem] text-white">
              {project.title}
            </h3>
            <p className="font-inter font-normal text-[12px] text-white/60 truncate">
              {project.description}
            </p>
          </div>
        </div>
      </Link>

      {/* Below Image Area */}
      <div className="p-4 flex flex-col justify-between flex-grow">
        {/* Tech tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.techStack.map((tech) => (
            <span
              key={tech}
              className="font-inter font-medium text-[11px] text-green border border-green-dim px-[10px] py-[3px] tracking-[0.08em] whitespace-nowrap"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Bottom Row */}
        <div className="flex justify-between items-center mt-auto border-t border-border/40 pt-3">
          {project.githubUrl ? (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-inter font-medium text-[12px] text-text-muted hover:text-amber transition-colors duration-200"
            >
              GitHub ↗
            </a>
          ) : (
            <span />
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-inter font-medium text-[12px] text-amber hover:underline transition-colors duration-200"
            >
              Live Demo ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
