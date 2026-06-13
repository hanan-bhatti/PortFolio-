import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ExperimentsSection() {
  const projects = await prisma.project.findMany({
    where: { featured: false },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  if (projects.length === 0) return null;

  return (
    <section className="bg-bg-surface py-24 px-4 md:px-[8vw]">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="pb-4 border-b border-border">
          <h2 className="font-syne font-bold text-[11px] tracking-[0.2em] text-text-muted uppercase">
            EXPERIMENTS & SIDE BUILDS
          </h2>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const isDiscontinued =
              project.description.toLowerCase().includes("discontinued") ||
              (project.longDesc && project.longDesc.toLowerCase().includes("discontinued"));

            return (
              <div
                key={project.id}
                className="group flex flex-col justify-between bg-bg-elevated border border-border p-6 transition-all duration-200 hover:border-amber"
              >
                <div>
                  {/* Badge */}
                  <div className="w-fit">
                    {isDiscontinued ? (
                      <span className="font-inter font-semibold text-[10px] tracking-[0.1em] bg-green-dim text-green px-[8px] py-[3px] uppercase">
                        DISCONTINUED
                      </span>
                    ) : (
                      <span className="font-inter font-semibold text-[10px] tracking-[0.1em] bg-green-dim text-green px-[8px] py-[3px] uppercase">
                        EXPERIMENT
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-syne font-bold text-[1.2rem] text-text-primary mt-3 group-hover:text-amber transition-colors duration-200">
                    {project.title}
                  </h3>

                  {/* Description */}
                  <p className="font-inter font-normal text-[13px] text-text-muted mt-2 line-height-[1.6]">
                    {project.description}
                  </p>
                </div>

                {/* Tags and GitHub Link */}
                <div className="mt-6 space-y-4">
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

                  {project.githubUrl && (
                    <div className="pt-2 border-t border-border/30">
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-inter font-medium text-[12px] text-text-muted hover:text-amber transition-colors duration-200"
                      >
                        GitHub →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
