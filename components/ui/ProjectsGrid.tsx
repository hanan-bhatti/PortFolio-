"use client";

import { useMemo, useState } from "react";
import ProjectCard, { type ProjectCardData } from "@/components/ui/ProjectCard";
import { cn } from "@/lib/utils";

export default function ProjectsGrid({ projects }: { projects: ProjectCardData[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tags = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.techStack.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [projects]);

  const filtered = activeTag ? projects.filter((p) => p.techStack.includes(activeTag)) : projects;

  return (
    <div>
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTag(null)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm transition-colors",
            activeTag === null ? "bg-indigo-accent text-white" : "glass text-zinc-300 hover:text-white"
          )}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(tag === activeTag ? null : tag)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              activeTag === tag ? "bg-indigo-accent text-white" : "glass text-zinc-300 hover:text-white"
            )}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
      {filtered.length === 0 && <p className="py-16 text-center text-zinc-500">No projects match this filter.</p>}
    </div>
  );
}
