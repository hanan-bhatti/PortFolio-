"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { settingsSchema, type SettingsInput } from "@/lib/validations";
import { saveSettingsAction } from "@/lib/actions";

const FIELDS: Array<{ name: keyof SettingsInput; label: string; placeholder: string; textarea?: boolean }> = [
  { name: "siteName", label: "Site name", placeholder: "Hanan Bhatti" },
  { name: "tagline", label: "Tagline", placeholder: "Full-Stack Developer" },
  { name: "aboutBio", label: "About bio", placeholder: "Tell visitors about yourself...", textarea: true },
  { name: "profilePhotoUrl", label: "Profile photo URL", placeholder: "https://..." },
  { name: "socialGithub", label: "GitHub URL", placeholder: "https://github.com/username" },
  { name: "socialLinkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/username" },
  { name: "socialTwitter", label: "Twitter / X URL", placeholder: "https://x.com/username" },
  { name: "socialEmail", label: "Public email", placeholder: "you@example.com" },
];

export default function SettingsForm({ initial }: { initial: SettingsInput }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<SettingsInput>({ resolver: zodResolver(settingsSchema), defaultValues: initial });

  const onSubmit = (values: SettingsInput): void => {
    // Optimistic UI: reflect saved state immediately, revert on failure.
    reset(values);
    toast.success("Settings saved");
    startTransition(async () => {
      const res = await saveSettingsAction(values);
      if (res.error) {
        toast.error(res.error);
        reset(initial);
      } else {
        router.refresh();
      }
    });
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-5" noValidate>
      {FIELDS.map((field) => (
        <div key={field.name}>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">{field.label}</label>
          {field.textarea ? (
            <textarea {...register(field.name)} placeholder={field.placeholder} rows={5} className={inputClass} />
          ) : (
            <input {...register(field.name)} placeholder={field.placeholder} className={inputClass} />
          )}
          {errors[field.name] ? <p className="mt-1 text-xs text-red-400">{errors[field.name]?.message}</p> : null}
        </div>
      ))}
      <button
        type="submit"
        disabled={isPending || !isDirty}
        className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
