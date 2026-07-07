"use client";

/**
 * @file components/admin/SkillForm.tsx
 * @description React component for SkillForm.tsx under the admin category.
 * 
 * @exports
 * - SkillForm (default): Main React component or function
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SkillIcon from "./SkillIcon";
import InfoTooltip from "./InfoTooltip";

const TECH_ICONS = [
  { name: "SiReact", label: "React" },
  { name: "SiNextdotjs", label: "Next.js" },
  { name: "SiTypescript", label: "TypeScript" },
  { name: "SiJavascript", label: "JavaScript" },
  { name: "SiNodedotjs", label: "Node.js" },
  { name: "SiNestjs", label: "NestJS" },
  { name: "SiExpress", label: "Express" },
  { name: "SiPostgresql", label: "PostgreSQL" },
  { name: "SiMongodb", label: "MongoDB" },
  { name: "SiRedis", label: "Redis" },
  { name: "SiClickhouse", label: "ClickHouse" },
  { name: "SiPrisma", label: "Prisma" },
  { name: "SiDocker", label: "Docker" },
  { name: "SiKubernetes", label: "Kubernetes" },
  { name: "SiApachekafka", label: "Kafka" },
  { name: "SiGit", label: "Git" },
  { name: "SiGithub", label: "GitHub" },
  { name: "SiLinux", label: "Linux" },
  { name: "SiNginx", label: "Nginx" },
  { name: "SiTailwindcss", label: "Tailwind CSS" },
  { name: "SiFramer", label: "Framer Motion" },
  { name: "SiGraphql", label: "GraphQL" },
  { name: "SiPython", label: "Python" },
  { name: "SiCplusplus", label: "C++" },
  { name: "SiCsharp", label: "C#" },
  { name: "SiRust", label: "Rust" },
  { name: "SiGo", label: "Go" },
  { name: "SiAmazonaws", label: "AWS" },
  { name: "SiGooglecloud", label: "GCP" },
  { name: "SiCloudflare", label: "Cloudflare" },
  { name: "SiVercel", label: "Vercel" },
  { name: "SiPnpm", label: "pnpm" },
  { name: "SiTurborepo", label: "Turborepo" },
  { name: "SiVite", label: "Vite" },
  { name: "SiVitest", label: "Vitest" },
  { name: "SiJest", label: "Jest" },
  { name: "SiElasticsearch", label: "Elasticsearch" },
  { name: "SiTypesense", label: "Typesense" },
  { name: "SiMinio", label: "MinIO" },
  { name: "SiTailscale", label: "Tailscale" },
  { name: "SiGnubash", label: "Bash" },
  { name: "SiVuedotjs", label: "Vue.js" },
  { name: "SiSvelte", label: "Svelte" },
  { name: "SiAngular", label: "Angular" },
  { name: "SiMysql", label: "MySQL" },
  { name: "SiSqlite", label: "SQLite" },
  { name: "SiFirebase", label: "Firebase" },
  { name: "SiSupabase", label: "Supabase" },
  { name: "SiFigma", label: "Figma" },
  { name: "SiPostman", label: "Postman" },
  { name: "SiJira", label: "Jira" },
  { name: "SiNotion", label: "Notion" },
  { name: "SiStripe", label: "Stripe" },
  { name: "SiWebpack", label: "Webpack" },
  { name: "SiBun", label: "Bun" },
  { name: "SiDeno", label: "Deno" },
];

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

interface SkillFormProps {
  skill?: Skill;
}

export default function SkillForm({ skill }: SkillFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(skill?.name || "");
  const [category, setCategory] = useState(skill?.category || "Frontend");
  const [level, setLevel] = useState(skill?.level || 80);
  const [icon, setIcon] = useState(skill?.icon || "SiReact");
  const [order, setOrder] = useState(skill?.order || 0);
  const [description, setDescription] = useState(skill?.description || "");
  const [color, setColor] = useState(skill?.color || "#F59E0B");

  const [searchQuery, setSearchQuery] = useState("");

  const filteredIcons = TECH_ICONS.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!category.trim()) {
      toast.error("Category is required");
      return;
    }

    startTransition(async () => {
      try {
        const url = skill ? `/api/admin/skills/${skill.id}` : "/api/admin/skills";
        const method = skill ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            category,
            level,
            icon: icon || null,
            order,
            description: description || null,
            color: color || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to save skill");
        }

        toast.success(skill ? "Skill updated successfully" : "Skill created successfully");

        if (!skill) {
          router.push("/admin/skills");
          router.refresh();
        } else {
          router.refresh();
        }
      } catch (error: any) {
        console.error(error);
        toast.error(error.message || "An error occurred");
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-12 items-start max-w-7xl">
      {/* LEFT: FORM */}
      <div className="w-full lg:w-1/2 max-w-2xl shrink-0">
        <Link
          href="/admin/skills"
          className="inline-flex items-center text-xs font-mono text-zinc-500 hover:text-white mb-6"
        >
          ← Back to Skills
        </Link>

        <h2 className="font-syne text-xl font-bold text-white mb-8">
          {skill ? `Edit Skill: ${skill.name}` : "Create New Skill"}
        </h2>

        <form data-tour="skill-editor-area" onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            Name *
            <InfoTooltip content="Display name of the skill as shown on your portfolio." />
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. React"
            className="w-full bg-[#1a1a1a] border border-[#262626] p-3 text-sm text-white font-sans focus:outline-none focus:border-[#F59E0B]"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            Category *
            <InfoTooltip content="Groups this skill under a category (e.g. Frontend, Backend, DevOps)." />
          </label>
          <input
            list="categories"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            placeholder="Select or type category"
            className="w-full bg-[#1a1a1a] border border-[#262626] p-3 text-sm text-white font-sans focus:outline-none focus:border-[#F59E0B]"
          />
          <datalist id="categories">
            <option value="Frontend" />
            <option value="Backend" />
            <option value="Database" />
            <option value="Infrastructure" />
            <option value="Languages" />
            <option value="Tools" />
            <option value="Messaging" />
            <option value="Payments" />
            <option value="Other" />
          </datalist>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="flex items-center justify-between text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              Description (Markdown Supported)
              <InfoTooltip content="Details about this skill, where you used it, what it is, etc. Supports bold, lists, and links. Max 500 characters." />
            </span>
            <span className={description.length > 500 ? "text-red-500" : "text-zinc-500"}>
              {description.length}/500
            </span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            placeholder="e.g. **Built high-performance UIs** at XYZ. See it in [Project X](/projects/x)."
            rows={5}
            className="w-full bg-[#1a1a1a] border border-[#262626] p-3 text-sm text-white font-sans focus:outline-none focus:border-[#F59E0B]"
          />
        </div>

        {/* Brand Color */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            Brand Color
            <InfoTooltip content="The hex color for this skill (e.g. #3178C6 for TypeScript)." />
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-12 rounded cursor-pointer border-0 p-0 bg-transparent"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#F59E0B"
              className="flex-1 bg-[#1a1a1a] border border-[#262626] p-3 text-sm text-white font-sans focus:outline-none focus:border-[#F59E0B]"
            />
          </div>
        </div>

        {/* Level */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">Level * <InfoTooltip content="Your proficiency level as a percentage (1–100). Higher values indicate greater expertise." /></span>
            <span className="text-[#F59E0B] font-bold">{level}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full accent-[#F59E0B] bg-[#262626] cursor-pointer"
          />
          {/* Live Progress Bar Preview */}
          <div className="w-full bg-[#262626] h-1.5 overflow-hidden">
            <div className="bg-[#F59E0B] h-full transition-all duration-150" style={{ width: `${level}%` }} />
          </div>
        </div>

        {/* Icon Picker */}
        <div className="space-y-4 pt-2">
          <label className="flex items-center gap-1.5 text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            Icon Picker
            <InfoTooltip content="Icon identifier used to render the skill's visual badge." />
          </label>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Visual Grid */}
            <div className="flex-1 space-y-2 min-w-0">
              <input
                type="text"
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-[#262626] p-2 text-xs text-white font-sans focus:outline-none focus:border-[#F59E0B]"
              />

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 max-h-60 overflow-y-auto p-2 border border-[#262626] bg-[#141414]">
                {filteredIcons.map((iconOption) => (
                  <button
                    type="button"
                    key={iconOption.name}
                    onClick={() => setIcon(iconOption.name)}
                    className={`p-2 flex flex-col items-center justify-center gap-1 transition-all ${
                      icon === iconOption.name
                        ? "border-2 border-[#F59E0B] bg-[#F59E0B]/10"
                        : "border border-[#262626] bg-black/20 hover:border-[#10B981]"
                    }`}
                  >
                    <SkillIcon
                      name={iconOption.name}
                      size={20}
                      className={icon === iconOption.name ? "text-[#F59E0B]" : "text-zinc-500"}
                    />
                    <span className="text-[9px] font-mono text-zinc-400 truncate max-w-full text-center leading-tight">
                      {iconOption.label}
                    </span>
                  </button>
                ))}
                {filteredIcons.length === 0 && (
                  <div className="col-span-full py-8 text-center text-xs text-zinc-650">
                    No matching standard icons found
                  </div>
                )}
              </div>
            </div>

            {/* Selected Icon Preview & Manual input */}
            <div className="flex flex-col gap-4 shrink-0 md:w-48">
              {/* Preview */}
              {icon ? (
                <div className="flex flex-col items-center justify-center p-4 border border-[#262626] bg-black/40 min-h-[110px]">
                  <span className="text-zinc-500 text-[9px] font-mono mb-2 uppercase">Selected Preview</span>
                  <SkillIcon name={icon} size={40} className="text-[#10B981]" />
                  <span className="text-zinc-400 text-[10px] font-mono mt-2 truncate max-w-full text-center">
                    {icon}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 border border-[#262626] bg-black/40 min-h-[110px] text-zinc-650 text-xs">
                  No icon selected
                </div>
              )}

              {/* Manual input */}
              <div className="space-y-1">
                <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  Or type icon name manually
                </span>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="e.g. SiReact"
                  className="w-full bg-[#1a1a1a] border border-[#262626] p-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-[#F59E0B]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            Display Order
            <InfoTooltip content="Controls sort order. Lower numbers appear first." />
          </label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="w-full bg-[#1a1a1a] border border-[#262626] p-3 text-sm text-white font-mono focus:outline-none focus:border-[#F59E0B]"
          />
          <p className="text-[11px] font-sans text-zinc-500">
            Lower numbers are shown first in listings (e.g. 0 shows before 10).
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#F59E0B] hover:bg-amber-400 text-black font-syne font-bold py-3 uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving..." : skill ? "Save Changes" : "Create Skill"}
        </button>
        </form>
      </div>

      {/* RIGHT: LIVE PREVIEW */}
      <div className="w-full lg:w-1/2 lg:sticky lg:top-8 hidden lg:block">
        <div className="mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">Live Preview</span>
        </div>
        
        <div 
          className="group rounded-3xl p-8 transition-colors duration-500 overflow-hidden shadow-2xl backdrop-blur-md"
          style={{ 
            '--brand-color': color || '#F59E0B',
            backgroundColor: `color-mix(in srgb, var(--brand-color) 12%, #080808)`,
            borderColor: `color-mix(in srgb, var(--brand-color) 30%, transparent)`,
            borderWidth: '1px',
            borderStyle: 'solid',
          } as React.CSSProperties}
        >
          {/* Premium Hover Gradient Background - intensifies the color on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-color)]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="flex flex-col xl:flex-row gap-8 relative z-10">
            {/* Left Side: Icon, Name, Progress */}
            <div className="xl:w-1/2 flex flex-col justify-center">
              <div className="flex items-center gap-6 mb-8">
                <div 
                  className="w-16 h-16 rounded-2xl border flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-2xl"
                  style={{
                    backgroundColor: `color-mix(in srgb, var(--brand-color) 8%, #000)`,
                    borderColor: `color-mix(in srgb, var(--brand-color) 25%, transparent)`
                  }}
                >
                   <SkillIcon name={icon || ""} size={32} />
                </div>
                <div className="flex-1">
                  <h4 className="font-syne font-bold text-2xl text-white tracking-tight group-hover:text-white transition-colors duration-300 line-clamp-1">
                    {name || "Skill Name"}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-white/50 text-xs tracking-wider uppercase font-inter block">Proficiency</span>
                    <span className="font-syne font-bold text-sm transition-colors duration-300" style={{ color: 'var(--brand-color)' }}>{level}%</span>
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
                    style={{ width: `${level}%`, backgroundColor: 'var(--brand-color)' }}
                  />
                </div>
              </div>
            </div>

            {/* Right Side: Description */}
            <div 
              className="xl:w-1/2 flex items-center border-t xl:border-t-0 xl:border-l pt-6 xl:pt-0 xl:pl-8 relative z-10"
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
                  {description || `Extensive experience utilizing **${name || "Skill Name"}** for building scalable applications and implementing robust solutions.`}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
