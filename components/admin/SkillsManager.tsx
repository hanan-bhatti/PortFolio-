"use client";

/**
 * @file components/admin/SkillsManager.tsx
 * @description React component for SkillsManager.tsx under the admin category.
 * 
 * @exports
 * - SkillsManager (default): Main React component or function
 */

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import SkillIcon from "./SkillIcon";
import EditorialModal from "./EditorialModal";

interface Skill {
  id: string;
  name: string;
  icon: string | null;
  level: number;
  category: string;
  order: number;
}

interface SkillsManagerProps {
  initialSkills: Skill[];
}

export default function SkillsManager({ initialSkills }: SkillsManagerProps) {
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/skills/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete skill");
      }

      setSkills((prev) => prev.filter((s) => s.id !== id));
      toast.success("Skill deleted successfully");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred while deleting");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const selectedSkillToDelete = skills.find(s => s.id === deleteId);

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

        {/* Add Skill */}
        <Link
          href="/admin/skills/new"
          className="border border-[#10B981] bg-[#10B981]/15 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#10B981] hover:bg-[#10B981]/30 transition-colors"
        >
          + Add Skill
        </Link>
      </div>

      {/* Empty State */}
      {skills.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-[#262626] bg-[#0c0c0c] py-16 text-center">
          <span className="text-3xl mb-3 text-zinc-600">❖</span>
          <h3 className="font-syne text-base font-bold text-white">No skills tracked yet</h3>
          <p className="font-sans text-xs text-zinc-500 mt-1 mb-6">Create your first skill to display in your portfolio.</p>
          <Link
            href="/admin/skills/new"
            className="border border-[#F59E0B] bg-[#F59E0B]/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-[#F59E0B] hover:bg-[#F59E0B]/25 transition-colors"
          >
            Add Your First Skill
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="border border-[#262626] bg-[#0c0c0c] p-5 flex flex-col justify-between"
            >
              <div>
                {/* Category & Order */}
                <div className="flex justify-between items-center text-[10px] font-mono mb-4">
                  <span className="bg-[#F59E0B]/10 text-[#F59E0B] px-2 py-0.5 tracking-wider uppercase font-semibold">
                    {skill.category}
                  </span>
                  <span className="text-zinc-500">Order: {skill.order}</span>
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <SkillIcon name={skill.icon || ""} size={32} className="text-[#10B981]" />
                </div>

                {/* Name */}
                <h4 className="font-syne font-bold text-base text-white mb-4">{skill.name}</h4>

                {/* Level */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono tracking-wider font-semibold text-zinc-500">
                    <span>LEVEL</span>
                    <span className="text-zinc-400">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-[#262626] h-1">
                    <div
                      className="bg-[#F59E0B] h-full"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#262626]/50 font-mono text-xs">
                <Link
                  href={`/admin/skills/${skill.id}`}
                  className="text-zinc-400 hover:text-[#F59E0B] transition-colors"
                >
                  Edit →
                </Link>
                <button
                  onClick={() => setDeleteId(skill.id)}
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
                  <th className="p-4 font-medium w-16">Icon</th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium w-1/4">Level</th>
                  <th className="p-4 font-medium text-center w-24">Order</th>
                  <th className="p-4 font-medium text-right w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]/50">
                {skills.map((skill, index) => (
                  <tr
                    key={skill.id}
                    className={index % 2 === 1 ? "bg-black/10" : "hover:bg-white/[0.01]"}
                  >
                    <td className="p-4">
                      <SkillIcon name={skill.icon || ""} size={24} className="text-[#10B981]" />
                    </td>
                    <td className="p-4 font-syne font-bold text-white">{skill.name}</td>
                    <td className="p-4 font-mono">
                      <span className="text-[#F59E0B] text-xs uppercase bg-[#F59E0B]/5 px-2 py-0.5 border border-[#F59E0B]/10">
                        {skill.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-[#262626] h-1 max-w-[150px]">
                          <div
                            className="bg-[#F59E0B] h-full"
                            style={{ width: `${skill.level}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-zinc-400">{skill.level}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-mono text-zinc-400">{skill.order}</td>
                    <td className="p-4 text-right font-mono text-xs">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/admin/skills/${skill.id}`}
                          className="text-zinc-400 hover:text-[#F59E0B] transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteId(skill.id)}
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
        title="Delete Skill?"
        description={`Are you sure you want to permanently delete the skill "${selectedSkillToDelete?.name}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete Skill"}
        cancelLabel="Cancel"
        onConfirm={() => deleteId && confirmDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
