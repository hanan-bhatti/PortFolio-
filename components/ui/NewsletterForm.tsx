"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      toast.success(data.message || "Subscribed successfully!");
      setEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to subscribe.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@domain.com"
        disabled={isLoading}
        className="w-full border border-[#262626] bg-[#050505] px-3 py-2 text-xs text-white placeholder-zinc-650 outline-none focus:border-amber transition-colors font-mono"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="border border-amber bg-amber px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-black hover:bg-amber/90 disabled:opacity-50 transition-colors font-mono cursor-pointer shrink-0"
      >
        {isLoading ? "..." : "JOIN"}
      </button>
    </form>
  );
}
