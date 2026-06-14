"use client";

/**
 * @file components/admin/AboutForm.tsx
 * @description React component for AboutForm.tsx under the admin category.
 * 
 * @exports
 * - AboutForm (default): Main React component or function
 */

import { useTransition, useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { aboutSchema, type AboutInput } from "@/lib/validations";
import { saveAboutSettingsAction } from "@/lib/actions";
import { UploadButton } from "@/lib/uploadthing";
import { compressImages } from "@/lib/image-compress";
import { cn } from "@/lib/utils";
import EditorialModal from "./EditorialModal";

interface DomainBlock {
  domain: string;
  skills: string[];
}

export default function AboutForm({ initial }: { initial: AboutInput }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [stack, setStack] = useState<DomainBlock[]>([]);
  const [skillInputs, setSkillInputs] = useState<{ [key: number]: string }>({});
  const [deleteDomainIndex, setDeleteDomainIndex] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<AboutInput>({
    resolver: zodResolver(aboutSchema),
    defaultValues: initial,
  });

  const aboutAvatarUrl = watch("about_avatar_url");

  // Tab State
  const activeTab = searchParams.get("tab") || "hero";
  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Load stack state from initial JSON string
  useEffect(() => {
    try {
      const parsed = JSON.parse(initial.about_stack);
      if (Array.isArray(parsed)) {
        setStack(parsed);
      }
    } catch {
      setStack([]);
    }
  }, [initial.about_stack]);

  const updateFormStack = (newStack: DomainBlock[]) => {
    setStack(newStack);
    setValue("about_stack", JSON.stringify(newStack), { shouldDirty: true });
  };

  // Stack Actions
  const addDomain = () => {
    const newStack = [...stack, { domain: "", skills: [] }];
    updateFormStack(newStack);
  };

  const removeDomain = (domainIndex: number) => {
    setDeleteDomainIndex(domainIndex);
  };

  const confirmRemoveDomain = () => {
    if (deleteDomainIndex === null) return;
    const newStack = stack.filter((_, i) => i !== deleteDomainIndex);
    updateFormStack(newStack);
    setDeleteDomainIndex(null);
  };

  const updateDomainName = (domainIndex: number, name: string) => {
    const newStack = [...stack];
    const block = newStack[domainIndex];
    if (block) {
      block.domain = name;
      updateFormStack(newStack);
    }
  };

  const moveDomainUp = (domainIndex: number) => {
    if (domainIndex === 0) return;
    const newStack = [...stack];
    const current = newStack[domainIndex];
    const prev = newStack[domainIndex - 1];
    if (current && prev) {
      newStack[domainIndex] = prev;
      newStack[domainIndex - 1] = current;
      updateFormStack(newStack);
    }
  };

  const moveDomainDown = (domainIndex: number) => {
    if (domainIndex === stack.length - 1) return;
    const newStack = [...stack];
    const current = newStack[domainIndex];
    const next = newStack[domainIndex + 1];
    if (current && next) {
      newStack[domainIndex] = next;
      newStack[domainIndex + 1] = current;
      updateFormStack(newStack);
    }
  };

  const addSkill = (domainIndex: number, skillInput: string) => {
    const skillsToAdd = skillInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (skillsToAdd.length === 0) return;

    const newStack = [...stack];
    const block = newStack[domainIndex];
    if (block) {
      const currentSkills = [...block.skills];
      let changed = false;
      skillsToAdd.forEach((skill) => {
        if (!currentSkills.includes(skill)) {
          currentSkills.push(skill);
          changed = true;
        }
      });
      if (changed) {
        block.skills = currentSkills;
        updateFormStack(newStack);
      }
    }
  };

  const removeSkill = (domainIndex: number, skillIndex: number) => {
    const newStack = [...stack];
    const block = newStack[domainIndex];
    if (block) {
      block.skills = block.skills.filter((_, i) => i !== skillIndex);
      updateFormStack(newStack);
    }
  };

  const onSubmit = (values: AboutInput): void => {
    reset(values);
    toast.success("Saving About settings...");
    startTransition(async () => {
      const res = await saveAboutSettingsAction(values);
      if (res.error) {
        toast.error(res.error);
        reset(initial);
        try {
          setStack(JSON.parse(initial.about_stack));
        } catch {
          setStack([]);
        }
      } else {
        toast.success("About settings saved!");
        router.refresh();
      }
    });
  };

  const inputClass =
    "w-full rounded-none border border-[#262626] bg-[#0c0c0c] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-amber";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6" noValidate>
      
      {/* Editorial Navigation Tabs */}
      <div className="flex flex-wrap gap-px border-b border-[#262626] bg-[#262626]/20 font-mono text-[11px] font-bold uppercase tracking-wider">
        {["hero", "story", "status", "cta", "stack"].map((tab) => {
          const labels = {
            hero: "Hero & Avatar",
            story: "Your Story",
            status: "Currently & Beyond",
            cta: "CTA Settings",
            stack: "Tech Stack",
          };
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setTab(tab)}
              className={cn(
                "border-b-2 px-5 py-3 transition-colors cursor-pointer",
                isActive
                  ? "border-[#F59E0B] bg-[#0c0c0c] text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-[#0c0c0c]/40"
              )}
            >
              {labels[tab as keyof typeof labels]}
            </button>
          );
        })}
      </div>

      {/* HERO SECTION */}
      {activeTab === "hero" && (
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-5 space-y-5">
          <h3 className="text-lg font-bold text-white border-b border-[#262626] pb-2 font-syne uppercase tracking-wider">Hero</h3>
          
          {/* Avatar Upload */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Avatar Image</label>
            {aboutAvatarUrl ? (
              <div className="relative mb-3 h-48 w-48 overflow-hidden border border-[#262626] bg-black/20">
                <Image src={aboutAvatarUrl} alt="Avatar" fill className="object-contain" />
                <button
                  type="button"
                  onClick={() => setValue("about_avatar_url", "", { shouldDirty: true })}
                  className="absolute top-2 right-2 rounded-none bg-black/70 px-2 py-0.5 text-xs text-red-400 border border-red-500/25"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="mb-3 flex h-20 w-48 items-center justify-center rounded-none border border-dashed border-[#262626] text-xs text-zinc-500">
                No avatar uploaded yet
              </div>
            )}
            <div className="w-48">
              <UploadButton
                endpoint="imageUploader"
                onBeforeUploadBegin={async (files: File[]) => {
                  toast.loading("Compressing and uploading image...", { id: "avatar-upload" });
                  return compressImages(files);
                }}
                onClientUploadComplete={(res) => {
                  const url = res[0]?.url;
                  if (url) {
                    setValue("about_avatar_url", url, { shouldDirty: true });
                    toast.success("Avatar uploaded successfully", { id: "avatar-upload" });
                  }
                }}
                onUploadError={(error: Error) => {
                  toast.error(`Upload failed: ${error.message}`, { id: "avatar-upload" });
                }}
              />
            </div>
            {errors.about_avatar_url ? (
              <p className="mt-1 text-xs text-red-400">{errors.about_avatar_url?.message}</p>
            ) : null}
          </div>

          {/* Tagline */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Hero Tagline</label>
            <input
              {...register("about_hero_tagline")}
              placeholder="e.g. CS student by day, full-stack dev by night..."
              className={inputClass}
            />
            {errors.about_hero_tagline ? (
              <p className="mt-1 text-xs text-red-400">{errors.about_hero_tagline?.message}</p>
            ) : null}
          </div>
        </div>
      )}

      {/* STORY SECTION */}
      {activeTab === "story" && (
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-5 space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-[#262626] pb-2 font-syne uppercase tracking-wider">Story</h3>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Your Story (markdown supported)
            </label>
            <textarea
              {...register("about_story")}
              placeholder="Tell your story..."
              rows={12}
              className={inputClass}
            />
            {errors.about_story ? (
              <p className="mt-1 text-xs text-red-400">{errors.about_story?.message}</p>
            ) : null}
          </div>
        </div>
      )}

      {/* STATUS & BEYOND SECTION */}
      {activeTab === "status" && (
        <div className="space-y-6">
          {/* CURRENTLY SECTION */}
          <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-5 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-[#262626] pb-2 font-syne uppercase tracking-wider">Currently</h3>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                What are you doing now? (markdown supported)
              </label>
              <textarea
                {...register("about_currently")}
                placeholder="What I'm doing now..."
                rows={5}
                className={inputClass}
              />
              {errors.about_currently ? (
                <p className="mt-1 text-xs text-red-400">{errors.about_currently?.message}</p>
              ) : null}
            </div>
          </div>

          {/* BEYOND CODE SECTION */}
          <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-5 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-[#262626] pb-2 font-syne uppercase tracking-wider">Beyond Code</h3>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                The Human Side (markdown supported)
              </label>
              <textarea
                {...register("about_beyond_code")}
                placeholder="Outside of coding, I like to..."
                rows={5}
                className={inputClass}
              />
              {errors.about_beyond_code ? (
                <p className="mt-1 text-xs text-red-400">{errors.about_beyond_code?.message}</p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* CTA SECTION */}
      {activeTab === "cta" && (
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-5 space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-[#262626] pb-2 font-syne uppercase tracking-wider">CTA</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">CTA Text</label>
              <input
                {...register("about_cta_text")}
                placeholder="Let's build something"
                className={inputClass}
              />
              {errors.about_cta_text ? (
                <p className="mt-1 text-xs text-red-400">{errors.about_cta_text?.message}</p>
              ) : null}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">CTA Email/Link</label>
              <input
                {...register("about_cta_email")}
                placeholder="you@email.com or https://..."
                className={inputClass}
              />
              {errors.about_cta_email ? (
                <p className="mt-1 text-xs text-red-400">{errors.about_cta_email?.message}</p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* TECH STACK VISUAL EDITOR */}
      {activeTab === "stack" && (
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-5 space-y-5">
          <h3 className="text-lg font-bold text-white border-b border-[#262626] pb-2 font-syne uppercase tracking-wider">Tech Stack</h3>
          
          <div className="space-y-4">
            {stack.map((block, domainIndex) => (
              <div
                key={domainIndex}
                className="border border-[#262626] bg-[#0c0c0c] p-4 relative space-y-3"
              >
                {/* Domain header control row */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="flex flex-1 items-center gap-2">
                    <div className="flex flex-col gap-1 mr-1 shrink-0">
                      <button
                        type="button"
                        disabled={domainIndex === 0}
                        onClick={() => moveDomainUp(domainIndex)}
                        className="p-1 text-xs text-zinc-400 hover:text-amber disabled:opacity-30 transition-colors"
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={domainIndex === stack.length - 1}
                        onClick={() => moveDomainDown(domainIndex)}
                        className="p-1 text-xs text-zinc-400 hover:text-amber disabled:opacity-30 transition-colors"
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>
                    <input
                      type="text"
                      value={block.domain}
                      placeholder="e.g. Frontend"
                      onChange={(e) => updateDomainName(domainIndex, e.target.value)}
                      className="w-full sm:w-64 rounded-none border border-[#262626] bg-black/30 px-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-amber font-mono uppercase tracking-wide"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeDomain(domainIndex)}
                    className="rounded-none border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-450 hover:bg-red-500/20 transition-colors sm:self-auto self-start"
                  >
                    × Remove Domain
                  </button>
                </div>

                {/* Skills tags list */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {block.skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="group/tag inline-flex items-center gap-1 font-mono text-[10px] border border-[#262626] px-[10px] py-[3px] bg-white/[0.03] text-zinc-300 rounded-none cursor-default"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(domainIndex, skillIndex)}
                        className="text-red-400 hover:text-red-500 font-bold ml-1 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {/* Inline Add Skill Input */}
                  <input
                    type="text"
                    placeholder="+ Add Skill"
                    value={skillInputs[domainIndex] ?? ""}
                    onChange={(e) =>
                      setSkillInputs({ ...skillInputs, [domainIndex]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const val = skillInputs[domainIndex] ?? "";
                        const skillName = val.trim().replace(/,$/, "");
                        if (skillName) {
                          addSkill(domainIndex, skillName);
                          setSkillInputs({ ...skillInputs, [domainIndex]: "" });
                        }
                      }
                    }}
                    className="rounded-none border border-[#262626] bg-black/20 px-2.5 py-1 text-[11px] text-white outline-none w-24 placeholder-zinc-600 focus:border-amber font-mono"
                  />
                </div>
              </div>
            ))}

            {stack.length === 0 && (
              <div className="text-center py-6 text-zinc-500 border border-dashed border-[#262626] rounded-none text-xs font-mono uppercase tracking-wide">
                No domains added yet. Click the button below to start.
              </div>
            )}

            <button
              type="button"
              onClick={addDomain}
              className="w-full rounded-none border border-dashed border-[#262626] hover:border-amber py-3 text-xs font-bold font-mono uppercase tracking-widest text-zinc-400 hover:text-amber transition-colors cursor-pointer text-center"
            >
              + Add Domain
            </button>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !isDirty}
        className="rounded-none bg-amber px-6 py-2.5 text-xs font-bold font-mono uppercase tracking-widest text-black hover:bg-amber/90 disabled:opacity-50 transition-colors cursor-pointer border border-amber"
      >
        {isPending ? "Saving..." : "Save About Settings"}
      </button>

      {/* Editorial Confirmation Modal for Stack Domain Deletion */}
      <EditorialModal
        isOpen={deleteDomainIndex !== null}
        type="danger"
        title="Remove Tech Stack Domain?"
        description={`Are you sure you want to remove the domain "${deleteDomainIndex !== null ? stack[deleteDomainIndex]?.domain : ""}" and all its skills? This will not be saved permanently until you click "Save About Settings".`}
        confirmLabel="Remove"
        cancelLabel="Keep Domain"
        onConfirm={confirmRemoveDomain}
        onCancel={() => setDeleteDomainIndex(null)}
      />
    </form>
  );
}
