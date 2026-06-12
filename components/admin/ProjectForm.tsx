"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing";
import { createProjectAction, updateProjectAction } from "@/lib/actions";
import type { ProjectInput } from "@/lib/validations";

const formSchema = z.object({
  title: z.string().min(2, "Title is required"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase with hyphens only"),
  description: z.string().min(10, "At least 10 characters"),
  longDesc: z.string(),
  techStack: z.string().min(1, "Add at least one technology"),
  liveUrl: z.string().url("Invalid URL").or(z.literal("")),
  githubUrl: z.string().url("Invalid URL").or(z.literal("")),
  coverImage: z.string(),
  featured: z.boolean(),
  order: z.coerce.number().int().min(0),
});
type FormValues = z.infer<typeof formSchema>;

export interface ProjectFormData {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDesc: string | null;
  techStack: string[];
  liveUrl: string | null;
  githubUrl: string | null;
  coverImage: string | null;
  featured: boolean;
  order: number;
}

export default function ProjectForm({ project }: { project: ProjectFormData | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: project?.title ?? "",
      slug: project?.slug ?? "",
      description: project?.description ?? "",
      longDesc: project?.longDesc ?? "",
      techStack: project?.techStack.join(", ") ?? "",
      liveUrl: project?.liveUrl ?? "",
      githubUrl: project?.githubUrl ?? "",
      coverImage: project?.coverImage ?? "",
      featured: project?.featured ?? false,
      order: project?.order ?? 0,
    },
  });

  const coverImage = watch("coverImage");

  const onSubmit = (values: FormValues): void => {
    const payload: ProjectInput = {
      title: values.title.trim(),
      slug: values.slug.trim(),
      description: values.description.trim(),
      longDesc: values.longDesc.trim() === "" ? null : values.longDesc.trim(),
      techStack: values.techStack.split(",").map((t) => t.trim()).filter(Boolean),
      liveUrl: values.liveUrl === "" ? null : values.liveUrl,
      githubUrl: values.githubUrl === "" ? null : values.githubUrl,
      coverImage: values.coverImage === "" ? null : values.coverImage,
      featured: values.featured,
      order: values.order,
    };
    startTransition(async () => {
      const res = project ? await updateProjectAction(project.id, payload) : await createProjectAction(payload);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(project ? "Project updated" : "Project created");
        router.push("/admin/projects");
        router.refresh();
      }
    });
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-indigo-500";
  const err = (msg?: string) => (msg ? <p className="mt-1 text-xs text-red-400">{msg}</p> : null);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4" noValidate>
      <div>
        <input
          {...register("title")}
          placeholder="Project title"
          className={inputClass}
          onBlur={(e) => {
            if (!project && watch("slug") === "") setValue("slug", slugify(e.target.value));
          }}
        />
        {err(errors.title?.message)}
      </div>
      <div>
        <input {...register("slug")} placeholder="project-slug" className={inputClass} />
        {err(errors.slug?.message)}
      </div>
      <div>
        <textarea {...register("description")} placeholder="Short description" rows={2} className={inputClass} />
        {err(errors.description?.message)}
      </div>
      <div>
        <textarea {...register("longDesc")} placeholder="Long description (optional)" rows={6} className={inputClass} />
      </div>
      <div>
        <input {...register("techStack")} placeholder="Tech stack, comma separated (e.g. Next.js, Prisma)" className={inputClass} />
        {err(errors.techStack?.message)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <input {...register("liveUrl")} placeholder="Live URL (optional)" className={inputClass} />
          {err(errors.liveUrl?.message)}
        </div>
        <div>
          <input {...register("githubUrl")} placeholder="GitHub URL (optional)" className={inputClass} />
          {err(errors.githubUrl?.message)}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-2 text-sm font-medium text-zinc-300">Cover image</p>
        {coverImage ? (
          <div className="relative mb-3 h-36 w-full overflow-hidden rounded-xl">
            <Image src={coverImage} alt="Cover" fill className="object-cover" />
            <button type="button" onClick={() => setValue("coverImage", "")} className="absolute top-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs text-red-400">
              Remove
            </button>
          </div>
        ) : null}
        <UploadButton
          endpoint="imageUploader"
          onClientUploadComplete={(res) => {
            const url = res[0]?.url;
            if (url) setValue("coverImage", url);
          }}
          onUploadError={(error: Error) => toast.error(`Upload failed: ${error.message}`)}
        />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" {...register("featured")} className="h-4 w-4 accent-indigo-600" />
          Featured on homepage
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          Order
          <input type="number" {...register("order")} className="w-20 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm" />
        </label>
      </div>

      <button type="submit" disabled={isPending} className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
        {isPending ? "Saving..." : project ? "Update Project" : "Create Project"}
      </button>
    </form>
  );
}
