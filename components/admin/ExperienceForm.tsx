"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface Experience {
  id: string;
  role: string;
  company: string;
  location: string | null;
  startDate: Date | string;
  endDate: Date | string | null;
  current: boolean;
  description: string;
  order: number;
}

interface ExperienceFormProps {
  experience?: Experience;
}

export default function ExperienceForm({ experience }: ExperienceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toMonthInputString = (dateVal: Date | string | null | undefined) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  };

  const [role, setRole] = useState(experience?.role || "");
  const [company, setCompany] = useState(experience?.company || "");
  const [location, setLocation] = useState(experience?.location || "");
  const [startDate, setStartDate] = useState(toMonthInputString(experience?.startDate));
  const [current, setCurrent] = useState(experience?.current || false);
  const [endDate, setEndDate] = useState(toMonthInputString(experience?.endDate));
  const [description, setDescription] = useState(experience?.description || "");
  const [order, setOrder] = useState(experience?.order || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role.trim()) {
      toast.error("Role is required");
      return;
    }
    if (!company.trim()) {
      toast.error("Company is required");
      return;
    }
    if (!startDate) {
      toast.error("Start Date is required");
      return;
    }
    if (!current && !endDate) {
      toast.error("End Date is required when you do not currently work there");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    startTransition(async () => {
      try {
        const url = experience ? `/api/admin/experience/${experience.id}` : "/api/admin/experience";
        const method = experience ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role,
            company,
            location: location || null,
            startDate: `${startDate}-01`, // Parse to the first day of that month
            endDate: current ? null : (endDate ? `${endDate}-01` : null),
            current,
            description,
            order,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to save experience");
        }

        toast.success(experience ? "Experience updated successfully" : "Experience created successfully");

        if (!experience) {
          router.push("/admin/experience");
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
        href="/admin/experience"
        className="inline-flex items-center text-xs font-mono text-zinc-500 hover:text-white mb-6"
      >
        ← Back to Experience
      </Link>

      <h2 className="font-syne text-xl font-bold text-white mb-8">
        {experience ? `Edit Experience: ${experience.role} at ${experience.company}` : "Create New Experience"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role */}
        <div className="space-y-2">
          <label className="block text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            Role *
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            placeholder="e.g. Full Stack Developer"
            className="w-full bg-[#1a1a1a] border border-[#262626] p-3 text-sm text-white font-sans focus:outline-none focus:border-[#F59E0B]"
          />
        </div>

        {/* Company */}
        <div className="space-y-2">
          <label className="block text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            Company *
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
            placeholder="e.g. Freelance"
            className="w-full bg-[#1a1a1a] border border-[#262626] p-3 text-sm text-white font-sans focus:outline-none focus:border-[#F59E0B]"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="block text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Lahore, Pakistan (Remote)"
            className="w-full bg-[#1a1a1a] border border-[#262626] p-3 text-sm text-white font-sans focus:outline-none focus:border-[#F59E0B]"
          />
        </div>

        {/* Dates row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Start Date */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
              Start Date *
            </label>
            <input
              type="month"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full bg-[#1a1a1a] border border-[#262626] p-3 text-sm text-white font-mono focus:outline-none focus:border-[#F59E0B]"
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
              End Date {current ? "" : "*"}
            </label>
            {current ? (
              <div className="w-full bg-[#1a1a1a]/50 border border-[#262626]/50 p-3 text-sm text-zinc-500 font-mono select-none">
                Present
              </div>
            ) : (
              <input
                type="month"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required={!current}
                className="w-full bg-[#1a1a1a] border border-[#262626] p-3 text-sm text-white font-mono focus:outline-none focus:border-[#F59E0B]"
              />
            )}
          </div>
        </div>

        {/* Currently working here checkbox */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="current"
            checked={current}
            onChange={(e) => {
              setCurrent(e.target.checked);
              if (e.target.checked) {
                setEndDate(""); // Clear end date when marked current
              }
            }}
            className="h-4 w-4 rounded-none border border-[#262626] bg-black text-amber accent-amber focus:ring-0 cursor-pointer"
          />
          <label htmlFor="current" className="text-xs font-mono font-semibold text-zinc-300 select-none cursor-pointer">
            I currently work here
          </label>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={6}
            placeholder="Describe your role, achievements, technologies used..."
            className="w-full bg-[#1a1a1a] border border-[#262626] p-3 text-sm text-white font-sans focus:outline-none focus:border-[#F59E0B] resize-y"
          />
          <span className="text-[10px] font-mono text-zinc-500 block">
            Markdown is supported.
          </span>
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
            Lower numbers are shown first (e.g. 0 shows before 10).
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-none border border-amber bg-amber hover:bg-amber/90 text-black font-mono font-bold py-3 uppercase tracking-widest transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Saving..." : experience ? "Save Changes" : "Create Experience"}
        </button>
      </form>
    </div>
  );
}
