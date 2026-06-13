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
        className="flex items-center justify-center bg-zinc-800 text-[10px] text-zinc-500 font-mono border border-zinc-700" 
        style={{ width: size, height: size }}
      >
        Si
      </div>
    );
  }
  return <IconComponent size={size} className={className} />;
}
