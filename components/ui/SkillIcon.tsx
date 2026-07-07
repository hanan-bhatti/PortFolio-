/**
 * @file components/ui/SkillIcon.tsx
 * @description React component for SkillIcon.tsx under the ui category.
 * 
 * @exports
 * - SkillIcon (default): Main React component or function
 */

import * as SiIcons from "react-icons/si";
import * as FaIcons from "react-icons/fa6";
import * as LuIcons from "react-icons/lu";

interface SkillIconProps {
  name: string;
  size?: number;
  className?: string;
}

export default function SkillIcon({ name, size = 32, className = "text-[#10B981]" }: SkillIconProps) {
  let IconComponent = (SiIcons as any)[name];
  if (!IconComponent) IconComponent = (FaIcons as any)[name];
  if (!IconComponent) IconComponent = (LuIcons as any)[name];

  const FallbackIcon = IconComponent ? (
    <IconComponent size={size} className={className} style={{ display: 'none' }} data-fallback />
  ) : (
    <div 
      className="flex items-center justify-center bg-zinc-900 text-[10px] text-zinc-500 font-mono border border-zinc-800 shrink-0 rounded-md" 
      style={{ width: size, height: size, display: 'none' }}
      data-fallback
    >
      ?
    </div>
  );

  // If it's a Simple Icon, we try to fetch the original colored SVG from the CDN
  if (name && name.startsWith("Si")) {
    const slug = name.replace(/^Si/, "").toLowerCase();
    return (
      <>
        <img
          src={`https://cdn.simpleicons.org/${slug}`}
          alt={name}
          width={size}
          height={size}
          className="object-contain"
          style={{ width: size, height: size }}
          onError={(e) => {
            // Fallback if CDN fails or slug is weird
            e.currentTarget.style.display = 'none';
            const sibling = e.currentTarget.nextElementSibling as HTMLElement;
            if (sibling) sibling.style.display = 'block';
          }}
        />
        {FallbackIcon}
      </>
    );
  }

  // Not a SiIcon, render immediately
  if (!IconComponent) {
    return (
      <div 
        className="flex items-center justify-center bg-zinc-900 text-[10px] text-zinc-500 font-mono border border-zinc-800 shrink-0 rounded-md" 
        style={{ width: size, height: size }}
      >
        ?
      </div>
    );
  }
  return <IconComponent size={size} className={className} />;
}

