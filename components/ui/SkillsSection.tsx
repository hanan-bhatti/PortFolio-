import SkillIcon from "./SkillIcon";

interface Skill {
  id: string;
  name: string;
  icon: string | null;
  level: number;
  category: string;
  order: number;
}

interface SkillsSectionProps {
  skills: Skill[];
}

export default function SkillsSection({ skills }: SkillsSectionProps) {
  if (!skills || skills.length === 0) return null;

  // Group skills by category while maintaining order
  const categoriesOrder = ["Languages", "Frontend", "Backend", "Database", "Infrastructure", "Tools", "Messaging", "Payments", "Other"];
  
  const groupedSkills = skills.reduce((acc, skill) => {
    const cat = skill.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  // Sort categories: pre-defined order first, then alphabetical for any custom ones
  const sortedCategories = Object.keys(groupedSkills).sort((a, b) => {
    const idxA = categoriesOrder.indexOf(a);
    const idxB = categoriesOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <section className="border-t border-[#262626] bg-[#0a0a0a] py-20 px-4 md:px-0">
      <div className="max-w-4xl mx-auto">
        <span className="font-inter font-semibold text-[11px] tracking-[0.2em] text-zinc-500 mb-2 block uppercase text-left">
          EXPERTISE
        </span>
        <h2 className="font-syne font-bold text-3xl text-white mb-12 uppercase text-left">
          Skills &amp; Technologies
        </h2>

        <div className="space-y-10">
          {sortedCategories.map((category) => {
            const categorySkills = groupedSkills[category] || [];
            // Sort skills inside category by order asc, then name asc
            const sortedSkills = [...categorySkills].sort((a, b) => {
              if (a.order !== b.order) return a.order - b.order;
              return a.name.localeCompare(b.name);
            });

            return (
              <div key={category} className="space-y-4">
                <h3 className="font-syne font-bold text-sm text-[#F59E0B] uppercase tracking-wider border-b border-[#262626] pb-2 text-left">
                  {category}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {sortedSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="border border-[#1f1f1f] bg-[#0e0e0e] p-3 flex items-center gap-3 transition-colors duration-200 hover:border-[#F59E0B]/50"
                    >
                      <SkillIcon name={skill.icon || ""} size={24} className="text-[#10B981] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-inter font-semibold text-xs text-white truncate text-left">
                          {skill.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 bg-[#1f1f1f] h-[2px]">
                            <div
                              className="bg-[#F59E0B] h-full"
                              style={{ width: `${skill.level}%` }}
                            />
                          </div>
                          <span className="font-mono text-[9px] text-zinc-500 shrink-0">
                            {skill.level}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
