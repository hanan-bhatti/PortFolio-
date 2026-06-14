/**
 * @file components/ui/SkillsMarquee.tsx
 * @description React component for SkillsMarquee.tsx under the ui category.
 * 
 * @exports
 * - SkillsMarquee (default): Main React component or function
 */

export default function SkillsMarquee({ skills }: { skills: string[] }) {
  if (skills.length === 0) return null;
  const doubled = [...skills, ...skills];
  return (
    <div className="overflow-hidden py-4">
      <ul className="marquee flex w-max gap-4">
        {doubled.map((skill, i) => (
          <li key={`${skill}-${i}`} className="glass rounded-full px-5 py-2 text-sm whitespace-nowrap text-zinc-200">
            {skill}
          </li>
        ))}
      </ul>
    </div>
  );
}
