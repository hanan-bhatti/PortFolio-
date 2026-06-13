"use client";

import { useMemo, useState } from "react";
import ProjectCard, { type ProjectCardData } from "@/components/ui/ProjectCard";
import { cn } from "@/lib/utils";
import { Skeleton } from "boneyard-js/react";
import Link from "next/link";

export default function ProjectsGrid({ projects }: { projects: ProjectCardData[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const tags = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.techStack.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [projects]);

  const filtered = activeTag ? projects.filter((p) => p.techStack.includes(activeTag)) : projects;

  const fixtureContent = (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          className="font-inter font-semibold text-[11px] tracking-[0.1em] uppercase px-4 py-1.5 border border-border bg-transparent text-text-muted rounded-none"
        >
          All
        </button>
        <button
          type="button"
          className="font-inter font-semibold text-[11px] tracking-[0.1em] uppercase px-4 py-1.5 border border-border bg-transparent text-text-muted rounded-none"
        >
          React
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.5rem]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-bg-surface border border-border overflow-hidden rounded-none h-[380px] flex flex-col justify-between p-4">
            <div className="h-[220px] w-full bg-bg-elevated" />
            <div className="h-4 bg-white/5 w-1/2 mt-4" />
            <div className="h-4 bg-white/5 w-3/4 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Skeleton name="projects-grid" loading={false} fixture={fixtureContent}>
      <div>
        {/* Filter Bar and View Toggle Container */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className={cn(
                "font-inter font-semibold text-[11px] tracking-[0.1em] uppercase px-4 py-1.5 border transition-colors duration-200 cursor-pointer rounded-none",
                activeTag === null
                  ? "bg-amber text-black border-amber"
                  : "bg-transparent text-text-muted border-border hover:border-amber hover:text-amber"
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
                  "font-inter font-semibold text-[11px] tracking-[0.1em] uppercase px-4 py-1.5 border transition-colors duration-200 cursor-pointer rounded-none",
                  activeTag === tag
                    ? "bg-amber text-black border-amber"
                    : "bg-transparent text-text-muted border-border hover:border-amber hover:text-amber"
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Grid/List View Toggle */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Grid Toggle Button */}
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className="p-2 transition-colors cursor-pointer"
              aria-label="Grid View"
            >
              <svg
                className={cn("w-5 h-5 fill-current", viewMode === "grid" ? "text-amber" : "text-text-muted hover:text-amber")}
                viewBox="0 0 24 24"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <div className="h-4 w-[1px] bg-border" />
            {/* List Toggle Button */}
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="p-2 transition-colors cursor-pointer"
              aria-label="List View"
            >
              <svg
                className={cn("w-5 h-5 fill-current", viewMode === "list" ? "text-amber" : "text-text-muted hover:text-amber")}
                viewBox="0 0 24 24"
              >
                <rect x="3" y="4" width="18" height="2" />
                <rect x="3" y="11" width="18" height="2" />
                <rect x="3" y="18" width="18" height="2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.5rem]">
            {filtered.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((project, index) => {
              const numStr = String(index + 1).padStart(2, "0");
              return (
                <div
                  key={project.slug}
                  className="group grid grid-cols-1 md:grid-cols-[auto_2fr_1fr_auto] gap-4 md:gap-8 items-center py-[1.5rem] border-b border-border hover:bg-bg-elevated transition-colors duration-200 px-4 -mx-4 md:px-6 md:-mx-6"
                >
                  {/* Number */}
                  <span className="font-syne font-bold text-[13px] text-amber min-w-[3rem]">
                    {numStr}
                  </span>

                  {/* Title and Short Description */}
                  <div className="flex flex-col gap-1 text-left">
                    <Link
                      href={`/projects/${project.slug}`}
                      className="font-syne font-bold text-[1.4rem] text-white hover:text-amber transition-colors duration-200"
                    >
                      {project.title}
                    </Link>
                    <p className="font-inter font-normal text-[13px] text-text-muted truncate max-w-xl">
                      {project.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tag) => (
                      <span
                        key={tag}
                        className="font-inter font-medium text-[11px] text-green border border-green-dim px-[10px] py-[3px] tracking-[0.08em] whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Arrow Link */}
                  <div className="flex justify-end">
                    <Link
                      href={`/projects/${project.slug}`}
                      className="font-syne text-[1.5rem] text-text-muted group-hover:text-amber transition-colors duration-200 leading-none"
                    >
                      ↗
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <p className="py-16 text-center text-zinc-500 font-inter text-sm">
            No projects match this filter.
          </p>
        )}
      </div>
    </Skeleton>
  );
}
