"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import EditorialModal from "./EditorialModal";

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

interface ExperienceManagerProps {
  initialExperiences: Experience[];
}

export default function ExperienceManager({ initialExperiences }: ExperienceManagerProps) {
  const [experiences, setExperiences] = useState<Experience[]>(initialExperiences);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/experience/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete experience");
      }

      setExperiences((prev) => prev.filter((exp) => exp.id !== id));
      toast.success("Experience deleted successfully");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred while deleting");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const formatExperienceDate = (dateVal: Date | string | null) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const getPeriod = (exp: Experience) => {
    const startStr = formatExperienceDate(exp.startDate);
    const endStr = exp.current ? "Present" : formatExperienceDate(exp.endDate);
    return `${startStr} — ${endStr}`;
  };

  const selectedExperienceToDelete = experiences.find(e => e.id === deleteId);

  return (
    <div className="space-y-6">
      {/* View Toggle and Create Row */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-4">
        {/* Toggle */}
        <div className="flex gap-1 border border-[#262626] p-1 bg-black/40 font-mono text-[11px] font-semibold">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 transition-colors ${
              viewMode === "grid"
                ? "bg-[#F59E0B] text-black font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            ⊞ GRID
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 transition-colors ${
              viewMode === "list"
                ? "bg-[#F59E0B] text-black font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            ☰ LIST
          </button>
        </div>

        {/* Add Experience */}
        <Link
          href="/admin/experience/new"
          className="border border-[#10B981] bg-[#10B981]/15 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#10B981] hover:bg-[#10B981]/30 transition-colors"
        >
          + Add Experience
        </Link>
      </div>

      {/* Empty State */}
      {experiences.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-[#262626] bg-[#0c0c0c] py-16 text-center">
          <span className="text-3xl mb-3 text-zinc-600">✦</span>
          <h3 className="font-syne text-base font-bold text-white">No experiences tracked yet</h3>
          <p className="font-sans text-xs text-zinc-500 mt-1 mb-6">Create your first experience to build your professional timeline.</p>
          <Link
            href="/admin/experience/new"
            className="border border-[#F59E0B] bg-[#F59E0B]/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-[#F59E0B] hover:bg-[#F59E0B]/25 transition-colors"
          >
            Add Your First Experience
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID MODE */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="border border-[#262626] border-l-[3px] border-l-[#F59E0B] bg-[#0c0c0c] p-5 flex flex-col justify-between"
            >
              <div>
                {/* Role & Current status */}
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-syne font-bold text-base text-white pr-2">{exp.role}</h4>
                  {exp.current && (
                    <span className="bg-[#10B981]/10 text-[#10B981] text-[9px] font-mono tracking-widest font-semibold px-2 py-0.5 uppercase shrink-0">
                      CURRENT
                    </span>
                  )}
                </div>

                {/* Company & Location */}
                <div className="text-xs font-semibold text-[#F59E0B] font-sans mb-1">{exp.company}</div>
                {exp.location && (
                  <div className="text-[11px] text-zinc-500 font-sans mb-3">{exp.location}</div>
                )}

                {/* Period */}
                <div className="text-xs font-mono text-zinc-400 mb-4">{getPeriod(exp)}</div>

                {/* Description */}
                <p className="text-xs text-zinc-400 font-sans line-clamp-3 leading-relaxed mt-2">
                  {exp.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#262626]/50 font-mono text-xs">
                <Link
                  href={`/admin/experience/${exp.id}`}
                  className="text-zinc-400 hover:text-[#F59E0B] transition-colors"
                >
                  Edit →
                </Link>
                <button
                  onClick={() => setDeleteId(exp.id)}
                  className="text-red-500 hover:text-red-400 transition-colors"
                >
                  Delete ×
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST MODE */
        <div className="border border-[#262626] bg-[#0c0c0c]">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-[13px]">
              <thead>
                <tr className="border-b border-[#262626] text-zinc-500 font-mono text-xs uppercase bg-black/20">
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Company</th>
                  <th className="p-4 font-medium">Location</th>
                  <th className="p-4 font-medium">Period</th>
                  <th className="p-4 font-medium text-center w-24">Current</th>
                  <th className="p-4 font-medium text-right w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]/50">
                {experiences.map((exp, index) => (
                  <tr
                    key={exp.id}
                    className={index % 2 === 1 ? "bg-black/10" : "hover:bg-white/[0.01]"}
                  >
                    <td className="p-4 font-syne font-bold text-white">{exp.role}</td>
                    <td className="p-4 text-[#F59E0B] font-semibold">{exp.company}</td>
                    <td className="p-4 text-zinc-400">{exp.location || "—"}</td>
                    <td className="p-4 font-mono text-xs text-zinc-400">{getPeriod(exp)}</td>
                    <td className="p-4 text-center">
                      {exp.current ? (
                        <span className="inline-block w-1.5 h-1.5 bg-[#10B981]" title="Current Role" />
                      ) : (
                        <span className="text-zinc-650 font-mono">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono text-xs">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/admin/experience/${exp.id}`}
                          className="text-zinc-400 hover:text-[#F59E0B] transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteId(exp.id)}
                          className="text-red-500 hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editorial Delete Confirmation Modal */}
      <EditorialModal
        isOpen={deleteId !== null}
        type="danger"
        title="Delete Experience?"
        description={`Are you sure you want to permanently delete your experience role "${selectedExperienceToDelete?.role}" at "${selectedExperienceToDelete?.company}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete Experience"}
        cancelLabel="Cancel"
        onConfirm={() => deleteId && confirmDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
