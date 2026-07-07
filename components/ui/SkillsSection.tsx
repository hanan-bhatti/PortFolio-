"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import SkillIcon from "./SkillIcon";
import EncryptedText from "./EncryptedText";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Register ScrollTrigger exactly once
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Skill {
  id: string;
  name: string;
  icon: string | null;
  level: number;
  category: string;
  order: number;
  description?: string | null;
  color?: string | null;
}

interface SkillsSectionProps {
  skills: Skill[];
}

export default function SkillsSection({ skills }: SkillsSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  if (!skills || skills.length === 0) return null;

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const cat = skill.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  // Define the desired order for categories
  const categoryOrder = ["Languages", "Frontend", "Backend", "Tools", "Currently Learning"];

  // Sort categories based on predefined order
  const sortedCategories = Object.keys(groupedSkills).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  useGSAP(() => {
    // Premium intro header animation with clip-path reveal
    gsap.fromTo(".skills-header-anim", 
      { opacity: 0, y: 50, clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" },
      { 
        opacity: 1, 
        y: 0, 
        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
        duration: 1.2, 
        stagger: 0.2,
        ease: "power4.out", 
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        }
      }
    );

    // Dynamic reveal and stacking for all skill cards
    const cards = gsap.utils.toArray('.skill-card-gsap');
    cards.forEach((card: any, index: number) => {
      // Entry animation
      gsap.fromTo(card,
        { 
          opacity: 0, 
          y: 80, 
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
          }
        }
      );

      // Stacking rotation animation (activates when card reaches its sticky point)
      const rotation = index % 2 === 0 ? -3 : 3;
      const stickyTop = 140 + (index * 16);
      gsap.to(card, {
        rotateZ: rotation,
        scale: 0.95,
        transformOrigin: "top center",
        scrollTrigger: {
          trigger: card,
          start: `top ${stickyTop}px`,
          end: `bottom ${stickyTop + 100}px`,
          scrub: true,
        }
      });
    });

    // Category title parallax/fade
    const titles = gsap.utils.toArray('.category-title-gsap');
    titles.forEach((title: any) => {
      gsap.fromTo(title,
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: title,
            start: "top 80%",
          }
        }
      );
    });

  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-32 relative bg-[#050505] min-h-screen selection:bg-amber-500/30">
      {/* Premium subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-24 relative z-10">
        
        {/* Intro Header */}
        <div className="mb-32 md:mb-48 max-w-4xl">
          <div className="skills-header-anim inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-amber-500/30 bg-amber-500/10 mb-8 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-amber-500 font-inter text-xs font-bold tracking-widest uppercase">
               <EncryptedText text="Technical Arsenal" />
            </span>
          </div>
          
          <h2 className="skills-header-anim font-syne font-bold text-6xl md:text-8xl lg:text-[130px] text-white tracking-tighter leading-[0.9] uppercase mb-8">
            Skills &<br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-orange-600">Expertise</span>
          </h2>
          
          <p className="skills-header-anim text-zinc-400 font-inter text-lg md:text-xl max-w-2xl leading-relaxed">
            I craft digital experiences using a curated stack of modern technologies. From scalable backends to pixel-perfect frontends, here is the machinery powering my work.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-40">
          {sortedCategories.map((category) => {
            const categorySkills = (groupedSkills[category] || []).sort((a, b) => {
              if (a.order !== b.order) return a.order - b.order;
              return a.name.localeCompare(b.name);
            });

            return (
              <div key={category} className="flex flex-col lg:flex-row gap-16 lg:gap-24 relative">
                
                {/* Sticky Left Column */}
                <div className="lg:w-5/12">
                  <div className="sticky top-32 z-20 pr-4">
                    <h3 className="category-title-gsap font-syne font-bold text-4xl md:text-5xl lg:text-5xl xl:text-6xl text-white uppercase tracking-tighter mb-6 break-words" style={{ wordBreak: 'keep-all', overflowWrap: 'anywhere' }}>
                      <EncryptedText text={category} />
                    </h3>
                    <div className="h-[2px] w-full bg-gradient-to-r from-amber-500/50 to-transparent" />
                    
                    {/* Skill counter stat */}
                    <div className="mt-8 flex items-center gap-4 text-zinc-500 font-inter text-sm font-medium">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900/50 text-white shadow-inner">
                        {categorySkills.length}
                      </span>
                      Technologies
                    </div>
                  </div>
                </div>

                {/* Scrolling Right Column (Cards) */}
                <div className="lg:w-7/12 flex flex-col gap-6 relative z-10 pb-16">
                  {categorySkills.map((skill, index) => (
                    <div 
                      key={skill.id}
                      className="skill-card-gsap group sticky rounded-3xl p-8 transition-colors duration-500 overflow-hidden shadow-2xl backdrop-blur-md"
                      style={{ 
                        '--brand-color': skill.color || '#F59E0B',
                        backgroundColor: `color-mix(in srgb, var(--brand-color) 12%, #080808)`,
                        borderColor: `color-mix(in srgb, var(--brand-color) 30%, transparent)`,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        top: `calc(140px + ${index * 16}px)`,
                      } as React.CSSProperties}
                    >
                      {/* Premium Hover Gradient Background - intensifies the color on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-color)]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                      
                      <div className="flex flex-col md:flex-row gap-8 relative z-10">
                        {/* Left Side: Icon, Name, Progress */}
                        <div className="md:w-1/2 flex flex-col justify-center">
                          <div className="flex items-center gap-6 mb-8">
                            <div 
                              className="w-16 h-16 rounded-2xl border flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-2xl"
                              style={{
                                backgroundColor: `color-mix(in srgb, var(--brand-color) 8%, #000)`,
                                borderColor: `color-mix(in srgb, var(--brand-color) 25%, transparent)`
                              }}
                            >
                               <SkillIcon name={skill.icon || ""} size={32} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-syne font-bold text-2xl text-white tracking-tight group-hover:text-white transition-colors duration-300 line-clamp-1">{skill.name}</h4>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-white/50 text-xs tracking-wider uppercase font-inter block">Proficiency</span>
                                <span className="font-syne font-bold text-sm transition-colors duration-300" style={{ color: 'var(--brand-color)' }}>{skill.level}%</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="relative z-10">
                            <div 
                              className="h-1.5 w-full rounded-full overflow-hidden border"
                              style={{ 
                                backgroundColor: `color-mix(in srgb, var(--brand-color) 15%, #000)`,
                                borderColor: `color-mix(in srgb, var(--brand-color) 20%, #000)`
                              }}
                            >
                              <div 
                                className="h-full opacity-80 group-hover:opacity-100 rounded-full transition-all duration-1000 ease-out origin-left shadow-[0_0_10px_var(--brand-color)]"
                                style={{ width: `${skill.level}%`, backgroundColor: 'var(--brand-color)' }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Description */}
                        <div 
                          className="md:w-1/2 flex items-center border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-8 relative z-10"
                          style={{ borderColor: `color-mix(in srgb, var(--brand-color) 20%, transparent)` }}
                        >
                          <div className="text-white/70 text-sm leading-relaxed font-inter group-hover:text-white/90 transition-colors duration-300 w-full">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                                a: ({node, ...props}) => <a className="text-[var(--brand-color)] hover:text-amber-400 underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                                strong: ({node, ...props}) => <strong className="text-white font-semibold" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-4" {...props} />,
                                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-white font-bold text-base mb-2 mt-4 first:mt-0" {...props} />,
                                h4: ({node, ...props}) => <h4 className="text-white font-semibold text-sm mb-2 mt-3 first:mt-0" {...props} />
                              }}
                            >
                              {skill.description || `Extensive experience utilizing **${skill.name}** for building scalable applications and implementing robust solutions.`}
                            </ReactMarkdown>
                          </div>
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
