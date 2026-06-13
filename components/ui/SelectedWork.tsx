import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SelectedWork() {
  const projects = await prisma.project.findMany({
    where: { featured: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <section className="bg-bg-surface py-24 px-4 md:px-[8vw]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex justify-between items-end pb-4 border-b border-border">
          <h2 className="font-syne font-bold text-[11px] tracking-[0.2em] text-text-muted uppercase">
            SELECTED WORK
          </h2>
          <Link
            href="/projects"
            className="font-syne font-bold text-[11px] tracking-[0.2em] text-amber hover:underline uppercase transition-colors"
          >
            View All Projects →
          </Link>
        </div>

        {/* Project List */}
        <div className="mt-4">
          {projects.length > 0 ? (
            projects.map((project, index) => {
              const numStr = String(index + 1).padStart(2, "0");
              return (
                <div
                  key={project.id}
                  className="group grid grid-cols-1 md:grid-cols-[auto_2fr_1fr_auto] gap-4 md:gap-8 items-center py-8 border-b border-border hover:bg-bg-elevated transition-colors duration-200 px-4 -mx-4 md:px-6 md:-mx-6"
                >
                  {/* Number */}
                  <span className="font-syne font-bold text-[13px] text-amber opacity-60 min-w-[3rem]">
                    {numStr}
                  </span>

                  {/* Title and Short Description */}
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/projects/${project.slug}`}
                      className="font-syne font-bold text-[clamp(1.5rem,3vw,2.2rem)] text-text-primary hover:text-amber transition-colors duration-200"
                    >
                      {project.title}
                    </Link>
                    <p className="font-inter font-normal text-[13px] text-text-muted max-w-xl">
                      {project.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tag, tagIdx) => (
                      <span
                        key={tagIdx}
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
            })
          ) : (
            <div className="py-12 border-b border-border text-center text-text-muted font-inter text-sm">
              No featured projects found. Add featured projects in the Admin Dashboard.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
