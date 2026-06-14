/**
 * @file components/ui/ExperienceSection.tsx
 * @description React component for ExperienceSection.tsx under the ui category.
 * 
 * @exports
 * - ExperienceSection (default): Main React component or function
 */

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Experience {
  id: string;
  role: string;
  company: string;
  location: string | null;
  startDate: Date | string;
  endDate: Date | string | null;
  current: boolean;
  description: string;
  order: number;
}

interface ExperienceSectionProps {
  experiences: Experience[];
}

export default function ExperienceSection({ experiences }: ExperienceSectionProps) {
  if (!experiences || experiences.length === 0) return null;

  const formatExperienceDate = (dateVal: Date | string | null) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const getPeriod = (exp: Experience) => {
    const startStr = formatExperienceDate(exp.startDate);
    const endStr = exp.current ? "Present" : formatExperienceDate(exp.endDate);
    return `${startStr} — ${endStr}`;
  };

  // Sort experiences: order ascending, then startDate descending (most recent first)
  const sortedExperiences = [...experiences].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    const dateA = new Date(a.startDate).getTime();
    const dateB = new Date(b.startDate).getTime();
    return dateB - dateA;
  });

  return (
    <section className="border-t border-[#262626] bg-[#0a0a0a] py-20 px-4 md:px-0">
      <div className="max-w-3xl mx-auto">
        <span className="font-inter font-semibold text-[11px] tracking-[0.2em] text-zinc-500 mb-2 block uppercase text-left">
          TIMELINE
        </span>
        <h2 className="font-syne font-bold text-3xl text-white mb-12 uppercase text-left">
          Professional Experience
        </h2>

        <div className="relative border-l border-[#1f1f1f] pl-6 ml-3 space-y-8 text-left">
          {sortedExperiences.map((exp) => (
            <div key={exp.id} className="relative group">
              {/* Timeline Dot Accent */}
              <span className="absolute -left-[30px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#0a0a0a] border border-[#262626] group-hover:border-[#F59E0B] transition-colors duration-200">
                <span className={`h-1.5 w-1.5 rounded-full ${exp.current ? "bg-[#10B981]" : "bg-zinc-700"} group-hover:bg-[#F59E0B]`} />
              </span>

              {/* Experience Card */}
              <div className="border border-[#1f1f1f] bg-[#0e0e0e] p-6 transition-all duration-200 hover:border-[#F59E0B]/40">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <h3 className="font-syne font-bold text-base text-white">
                    {exp.role}
                  </h3>
                  <span className="font-mono text-xs text-[#F59E0B] font-medium shrink-0">
                    {getPeriod(exp)}
                  </span>
                </div>

                {/* Company & Location */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono mb-4 text-zinc-400">
                  <span className="text-[#10B981] font-semibold">{exp.company}</span>
                  {exp.location && (
                    <>
                      <span className="text-zinc-700">|</span>
                      <span>{exp.location}</span>
                    </>
                  )}
                  {exp.current && (
                    <span className="ml-auto bg-[#10B981]/10 text-[#10B981] text-[9px] font-mono tracking-widest font-semibold px-2 py-0.5 uppercase shrink-0">
                      Active
                    </span>
                  )}
                </div>

                {/* Description Markdown */}
                <div className="font-inter text-xs text-zinc-400 leading-relaxed prose prose-invert prose-xs max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="mb-0.5">{children}</li>,
                      a: ({ href, children }) => (
                        <a href={href} className="text-[#10B981] hover:underline" target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      )
                    }}
                  >
                    {exp.description}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
