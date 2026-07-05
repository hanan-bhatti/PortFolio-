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
import { FiArrowUp, FiArrowDown, FiTrash2, FiPlus, FiX } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import EditorialModal from "./EditorialModal";
import InfoTooltip from "./InfoTooltip";

const MarkdownComponents = {
  p: ({ children }: any) => (
    <p className="font-mono text-xs leading-[1.8] text-zinc-300 mb-3 text-left whitespace-pre-line">
      {children}
    </p>
  ),
  h1: ({ children }: any) => (
    <h2 className="font-syne font-bold text-lg text-white mt-4 mb-2 uppercase text-left">
      {children}
    </h2>
  ),
  h2: ({ children }: any) => (
    <h2 className="font-syne font-bold text-base text-amber mt-4 mb-2 uppercase text-left">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="font-syne font-bold text-sm text-amber mt-3 mb-1.5 uppercase text-left">
      {children}
    </h3>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      className="text-green hover:underline font-medium"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc pl-5 mb-3 space-y-1 text-left text-zinc-300">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal pl-5 mb-3 space-y-1 text-left text-zinc-300">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="font-mono text-xs leading-[1.8] text-zinc-300">
      {children}
    </li>
  ),
};

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

  const watchStory = watch("about_story") || "";
  const watchCurrently = watch("about_currently") || "";
  const watchBeyondCode = watch("about_beyond_code") || "";

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
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-6xl space-y-6" noValidate>
      
      {/* Editorial Navigation Tabs */}
      <div className="relative border-b border-[#262626]">
        {/* Right Fade indicator on mobile */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
        
        <div className="flex flex-row flex-nowrap overflow-x-auto scrollbar-none gap-px bg-[#262626]/20 font-mono text-[11px] font-bold uppercase tracking-wider min-w-0 pr-8 md:pr-0">
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
                data-tour={`about-tab-${tab}`}
                key={tab}
                type="button"
                onClick={() => setTab(tab)}
                className={cn(
                  "border-b-2 px-5 py-3 transition-colors cursor-pointer whitespace-nowrap shrink-0",
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
      </div>

      {/* HERO SECTION */}
      {activeTab === "hero" && (
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-5 space-y-5">
          <h3 className="text-lg font-bold text-white border-b border-[#262626] pb-2 font-syne uppercase tracking-wider">Hero</h3>
          
          {/* Avatar Upload */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-zinc-300">Avatar Image <InfoTooltip content="Your profile photo displayed on the About page hero section." /></label>
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
                  const url = res[0]?.ufsUrl ?? res[0]?.url;
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
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-300">Hero Tagline <InfoTooltip content="Short punchy tagline shown in the hero header of your About page." /></label>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-5 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-[#262626] pb-2 font-syne uppercase tracking-wider">Story Editor</h3>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-350">
                Your Story (markdown supported)
                <InfoTooltip content="Long-form markdown biography rendered on your About page story section." />
              </label>
              <textarea
                {...register("about_story")}
                placeholder="Tell your story..."
                rows={15}
                className={inputClass}
              />
              {errors.about_story ? (
                <p className="mt-1 text-xs text-red-400">{errors.about_story?.message}</p>
              ) : null}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-5 space-y-4 flex flex-col">
            <h3 className="text-lg font-bold text-zinc-400 border-b border-[#262626] pb-2 font-syne uppercase tracking-wider">Live Preview</h3>
            <div className="flex-1 max-h-[400px] overflow-y-auto pr-2">
              {watchStory.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                  {watchStory}
                </ReactMarkdown>
              ) : (
                <p className="text-zinc-600 italic text-[11px]">Start typing to see the live rendering...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STATUS & BEYOND SECTION */}
      {activeTab === "status" && (
        <div className="space-y-6">
          {/* CURRENTLY SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor */}
            <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-5 space-y-4">
              <h3 className="text-lg font-bold text-white border-b border-[#262626] pb-2 font-syne uppercase tracking-wider">Currently</h3>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-350">
                  What are you doing now? (markdown supported)
                  <InfoTooltip content="Markdown content shown in your Currently section — what you're working on right now." />
                </label>
                <textarea
                  {...register("about_currently")}
                  placeholder="What I'm doing now..."
                  rows={8}
                  className={inputClass}
                />
                {errors.about_currently ? (
                  <p className="mt-1 text-xs text-red-400">{errors.about_currently?.message}</p>
                ) : null}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-5 space-y-4 flex flex-col">
              <h3 className="text-lg font-bold text-zinc-400 border-b border-[#262626] pb-2 font-syne uppercase tracking-wider">Currently Preview</h3>
              <div className="flex-1 max-h-[250px] overflow-y-auto pr-2">
                {watchCurrently.trim() ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                    {watchCurrently}
                  </ReactMarkdown>
                ) : (
                  <p className="text-zinc-600 italic text-[11px]">Start typing to see currently preview...</p>
                )}
              </div>
            </div>
          </div>

          {/* BEYOND CODE SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor */}
            <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-5 space-y-4">
              <h3 className="text-lg font-bold text-white border-b border-[#262626] pb-2 font-syne uppercase tracking-wider">Beyond Code</h3>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-350">
                  The Human Side (markdown supported)
                  <InfoTooltip content="Interests and hobbies outside of coding, shown in your Beyond Code section." />
                </label>
                <textarea
                  {...register("about_beyond_code")}
                  placeholder="Outside of coding, I like to..."
                  rows={8}
                  className={inputClass}
                />
                {errors.about_beyond_code ? (
                  <p className="mt-1 text-xs text-red-400">{errors.about_beyond_code?.message}</p>
                ) : null}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-5 space-y-4 flex flex-col">
              <h3 className="text-lg font-bold text-zinc-400 border-b border-[#262626] pb-2 font-syne uppercase tracking-wider">Beyond Code Preview</h3>
              <div className="flex-1 max-h-[250px] overflow-y-auto pr-2">
                {watchBeyondCode.trim() ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                    {watchBeyondCode}
                  </ReactMarkdown>
                ) : (
                  <p className="text-zinc-600 italic text-[11px]">Start typing to see beyond code preview...</p>
                )}
              </div>
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
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-300">CTA Text <InfoTooltip content="Button label text for your About page call-to-action." /></label>
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
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-300">CTA Email/Link <InfoTooltip content="Email address or URL the CTA button links to." /></label>
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
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-6 space-y-6">
          <div className="border-b border-[#262626] pb-3 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white font-syne uppercase tracking-wider">Tech Stack Configuration</h3>
            <span className="text-[10px] text-zinc-550 font-mono uppercase tracking-wider">{stack.length} Domains</span>
          </div>
          
          <div className="space-y-6">
            {stack.map((block, domainIndex) => (
              <div
                key={domainIndex}
                className="border border-[#262626] bg-[#080808] p-5 space-y-4 rounded-none hover:border-[#383838] transition-colors"
              >
                {/* Domain Header Control Row */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-b border-[#262626]/40 pb-3">
                  <div className="flex flex-1 items-center gap-2">
                    {/* Reorder Buttons */}
                    <div className="flex items-center gap-1 mr-1 shrink-0 border border-[#262626] bg-black p-0.5">
                      <button
                        type="button"
                        disabled={domainIndex === 0}
                        onClick={() => moveDomainUp(domainIndex)}
                        className="p-1.5 text-zinc-500 hover:text-amber disabled:opacity-20 disabled:hover:text-zinc-500 transition-colors"
                        title="Move Up"
                      >
                        <FiArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={domainIndex === stack.length - 1}
                        onClick={() => moveDomainDown(domainIndex)}
                        className="p-1.5 text-zinc-500 hover:text-amber disabled:opacity-20 disabled:hover:text-zinc-500 transition-colors border-l border-[#262626]"
                        title="Move Down"
                      >
                        <FiArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Domain Title Input */}
                    <input
                      type="text"
                      value={block.domain}
                      placeholder="e.g. Frontend"
                      onChange={(e) => updateDomainName(domainIndex, e.target.value)}
                      className="w-full sm:w-64 rounded-none border border-[#262626] bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-700 outline-none focus:border-amber font-mono uppercase tracking-wider font-bold"
                    />
                  </div>

                  {/* Remove Domain Button */}
                  <button
                    type="button"
                    onClick={() => removeDomain(domainIndex)}
                    className="flex items-center gap-1.5 rounded-none border border-red-950 text-red-400 bg-red-950/20 px-3 py-1.5 text-xs hover:bg-red-950/40 hover:text-red-300 transition-colors sm:self-auto self-start font-mono uppercase tracking-wider font-bold"
                    title="Remove Domain"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    <span>Delete Domain</span>
                  </button>
                </div>

                {/* Skills Tags List */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {block.skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold border border-[#262626] px-3 py-1 bg-black text-zinc-300 rounded-none transition-colors hover:border-[#383838]"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(domainIndex, skillIndex)}
                        className="text-red-400 hover:text-red-500 p-0.5 focus:outline-none transition-colors"
                        title={`Remove ${skill}`}
                      >
                        <FiX className="w-3 h-3 shrink-0" />
                      </button>
                    </span>
                  ))}

                  {/* Inline Expanding Add Skill Input */}
                  <div className="inline-flex items-center gap-1.5 border border-dashed border-[#262626] bg-black/40 pl-3 pr-2 py-1 text-zinc-500 focus-within:border-amber focus-within:text-zinc-300 transition-colors font-mono text-xs w-full sm:w-auto">
                    <FiPlus className="w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder="Add skill..."
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
                      className="bg-transparent border-0 outline-none text-[11px] text-white placeholder-zinc-650 w-24 focus:w-40 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            ))}

            {stack.length === 0 && (
              <div className="text-center py-8 text-zinc-550 border border-dashed border-[#262626] rounded-none text-xs font-mono uppercase tracking-widest">
                No domains added yet. Click the button below to start.
              </div>
            )}

            <button
              type="button"
              onClick={addDomain}
              className="w-full rounded-none border border-dashed border-[#262626] hover:border-amber py-3.5 text-xs font-bold font-mono uppercase tracking-widest text-zinc-400 hover:text-amber transition-colors cursor-pointer text-center"
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
