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
    <div className="glass group relative overflow-hidden rounded-2xl transition-shadow hover:glow-indigo">
      <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-indigo-accent/20 blur-3xl" />
      <Link href={`/projects/${project.slug}`} className="block">
        <div className="relative h-44 w-full bg-surface-light">
          {project.coverImage ? (
            <Image src={project.coverImage} alt={project.title} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl font-bold text-white/10">
              {project.title.charAt(0)}
            </div>
          )}
        </div>
        <div className="p-5">
          <h3 className="text-lg font-semibold text-white group-hover:text-cyan-accent">{project.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{project.description}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <li key={tech} className="rounded-full bg-indigo-accent/15 px-2.5 py-0.5 text-xs text-indigo-300">
                {tech}
              </li>
            ))}
          </ul>
        </div>
      </Link>
      <div className="flex gap-4 border-t border-white/5 px-5 py-3">
        {project.liveUrl ? (
          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-accent hover:underline">
            Live ↗
          </a>
        ) : null}
        {project.githubUrl ? (
          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-white hover:underline">
            GitHub ↗
          </a>
        ) : null}
      </div>
    </div>
  );
}
