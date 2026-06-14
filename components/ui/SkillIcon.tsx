/**
 * @file components/ui/SkillIcon.tsx
 * @description React component for SkillIcon.tsx under the ui category.
 * 
 * @exports
 * - SkillIcon (default): Main React component or function
 */

import * as SiIcons from "react-icons/si";

interface SkillIconProps {
  name: string;
  size?: number;
  className?: string;
}

export default function SkillIcon({ name, size = 32, className = "text-[#10B981]" }: SkillIconProps) {
  const IconComponent = (SiIcons as any)[name];
  if (!IconComponent) {
    return (
      <div 
        className="flex items-center justify-center bg-zinc-900 text-[10px] text-zinc-500 font-mono border border-zinc-800 shrink-0" 
        style={{ width: size, height: size }}
      >
        Si
      </div>
    );
  }
  return <IconComponent size={size} className={className} />;
}
