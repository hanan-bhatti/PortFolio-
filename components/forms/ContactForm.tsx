"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { contactSchema, type ContactInput } from "@/lib/validations";

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (data: ContactInput): Promise<void> => {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      toast.success("Message sent! I'll get back to you soon.");
      reset();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const inputClass =
    "glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-indigo-accent";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <input {...register("name")} placeholder="Your name" className={inputClass} />
        {errors.name ? <p className="mt-1 text-xs text-red-400">{errors.name.message}</p> : null}
      </div>
      <div>
        <input {...register("email")} type="email" placeholder="you@email.com" className={inputClass} />
        {errors.email ? <p className="mt-1 text-xs text-red-400">{errors.email.message}</p> : null}
      </div>
      <div>
        <input {...register("subject")} placeholder="Subject" className={inputClass} />
        {errors.subject ? <p className="mt-1 text-xs text-red-400">{errors.subject.message}</p> : null}
      </div>
      <div>
        <textarea {...register("message")} placeholder="Your message..." rows={6} className={inputClass} />
        {errors.message ? <p className="mt-1 text-xs text-red-400">{errors.message.message}</p> : null}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="glow-indigo w-full rounded-xl bg-indigo-accent py-3 font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
