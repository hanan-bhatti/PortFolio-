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
import SkillIcon from "./SkillIcon";

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
    <div className="max-w-2xl">
      <Link
        href="/admin/skills"
        className="inline-flex items-center text-xs font-mono text-zinc-500 hover:text-white mb-6"
      >
        ← Back to Skills
      </Link>

      <h2 className="font-syne text-xl font-bold text-white mb-8">
        {skill ? `Edit Skill: ${skill.name}` : "Create New Skill"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <label className="block text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            Name *
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
          <label className="block text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            Category *
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

        {/* Level */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            <span>Level *</span>
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
          <label className="block text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            Icon Picker
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
          <label className="block text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            Display Order
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
  );
}
