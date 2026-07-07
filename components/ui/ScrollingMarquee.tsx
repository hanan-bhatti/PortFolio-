import React from "react";
import * as SiIcons from "react-icons/si";
import * as FaIcons from "react-icons/fa6";
import * as LuIcons from "react-icons/lu";

interface ScrollingMarqueeProps {
  skills?: string;
}

export default function ScrollingMarquee({ skills }: ScrollingMarqueeProps) {
  let items: { name: string; icon: string }[] = [];
  try {
    if (skills && skills.startsWith("[")) {
      items = JSON.parse(skills);
    } else if (skills) {
      items = skills
        .split(",")
        .map((s) => ({ name: s.trim(), icon: "" }))
        .filter((s) => s.name.length > 0);
    } else {
      items = [
        { name: "React", icon: "SiReact" },
        { name: "Next.js", icon: "SiNextdotjs" },
        { name: "TypeScript", icon: "SiTypescript" },
        { name: "Node.js", icon: "SiNodedotjs" },
        { name: "TailwindCSS", icon: "SiTailwindcss" },
        { name: "PostgreSQL", icon: "SiPostgresql" },
        { name: "Docker", icon: "SiDocker" },
      ];
    }
  } catch (e) {
    items = [];
  }

  // Create two halves to show in two ribbons
  const row1 = items.slice(0, Math.ceil(items.length / 2));
  const row2 = items.slice(Math.ceil(items.length / 2));

  // If one row is empty (only 1 item), use full items for both
  const arr1 = row1.length > 0 ? row1 : items;
  const arr2 = row2.length > 0 ? row2 : items;

  const renderIcon = (iconName: string) => {
    if (!iconName) return null;
    let Icon = (SiIcons as any)[iconName];
    if (!Icon) Icon = (FaIcons as any)[iconName];
    if (!Icon) Icon = (LuIcons as any)[iconName];
    return Icon ? <Icon className="w-5 h-5 text-amber" /> : null;
  };

  const Ribbon = ({ data, reverse, rotation }: { data: typeof items, reverse: boolean, rotation: string }) => (
    <div className={`w-[120%] -ml-[10%] md:w-[110%] md:-ml-[5%] py-3 md:py-4 bg-black/40 backdrop-blur-md border-y border-white/5 overflow-hidden select-none absolute top-1/2 -translate-y-1/2 ${rotation} shadow-2xl z-10`}>
      <div className={`flex w-max gap-6 md:gap-8 pr-6 md:pr-8 ${reverse ? "animate-marquee-scroll-reverse" : "animate-marquee-scroll"}`}>
        {[...Array(4)].map((_, idx) => (
          <React.Fragment key={idx}>
            {data.map((item, i) => (
              <div key={`${idx}-${i}`} className="flex items-center gap-2 md:gap-3">
                {renderIcon(item.icon)}
                <span className="text-[11px] md:text-[13px] font-bold tracking-[0.1em] text-zinc-300 font-mono uppercase">
                  {item.name}
                </span>
                <span className="text-zinc-700 ml-4 md:ml-5 font-sans">✦</span>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-[180px] md:h-[240px] overflow-hidden flex flex-col items-center justify-center bg-[#050505]">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] md:bg-[size:32px_32px]"></div>
      
      {/* Vignette mask for the grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)]"></div>

      {/* Ribbons */}
      <Ribbon data={arr1} reverse={false} rotation="-rotate-6 md:-rotate-3" />
      <Ribbon data={arr2} reverse={true} rotation="rotate-6 md:rotate-3" />
    </div>
  );
}
