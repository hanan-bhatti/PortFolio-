"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { deleteProjectAction, reorderProjectsAction } from "@/lib/actions";
import { FiGrid, FiList, FiTrash2, FiEdit3, FiMove } from "react-icons/fi";
import { cn } from "@/lib/utils";
import EditorialModal from "./EditorialModal";

export interface AdminProjectRow {
  id: string;
  title: string;
  slug: string;
  featured: boolean;
  techStack: string[];
}

function SortableRow({
  project,
  onDeleteRequest,
  disabled,
}: {
  project: AdminProjectRow;
  onDeleteRequest: (id: string, title: string) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 border-b border-[#262626] bg-[#0c0c0c] px-4 py-3 font-mono text-xs",
        isDragging && "z-10 opacity-70 border-[#F59E0B]"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-zinc-650 hover:text-zinc-300 p-1"
        title="Drag to reorder"
      >
        <FiMove className="h-3.5 w-3.5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-white">
          {project.title}
          {project.featured ? (
            <span className="ml-2 border border-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#F59E0B] uppercase">
              Featured
            </span>
          ) : null}
        </p>
        <p className="truncate text-[10px] text-zinc-500 mt-0.5">
          /{project.slug} • {project.techStack.join(", ")}
        </p>
      </div>
      <div className="flex gap-2 font-bold uppercase tracking-wider text-[10px]">
        <Link
          href={`/admin/projects/${project.id}/edit`}
          className="border border-[#262626] bg-black/30 px-2.5 py-1 text-zinc-350 hover:border-[#F59E0B] hover:text-[#F59E0B] transition-colors"
        >
          Edit
        </Link>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDeleteRequest(project.id, project.title)}
          className="border border-red-500/30 bg-red-500/5 px-2.5 py-1 text-red-400 hover:border-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-30"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export default function ProjectsManager({ initial }: { initial: AdminProjectRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [items, setItems] = useState(initial);
  const [isPending, startTransition] = useTransition();

  // Sync state if initial items change
  useEffect(() => {
    setItems(initial);
  }, [initial]);

  // Layout State (list vs grid)
  const [activeLayout, setActiveLayoutState] = useState<string>("list");

  useEffect(() => {
    const saved = localStorage.getItem("admin_projects_layout");
    const urlParam = searchParams.get("layout");
    if (urlParam) {
      setActiveLayoutState(urlParam);
      localStorage.setItem("admin_projects_layout", urlParam);
    } else if (saved) {
      setActiveLayoutState(saved);
      const params = new URLSearchParams(window.location.search);
      params.set("layout", saved);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [searchParams, pathname, router]);

  const setLayout = (layout: string) => {
    setActiveLayoutState(layout);
    localStorage.setItem("admin_projects_layout", layout);
    const params = new URLSearchParams(searchParams.toString());
    params.set("layout", layout);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const onDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    startTransition(async () => {
      const res = await reorderProjectsAction(reordered.map((p) => p.id));
      if (res.error) toast.error(res.error);
      else toast.success("Project order updated");
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { id, title } = deleteTarget;
    const toastId = toast.loading(`Deleting "${title}"...`);
    startTransition(async () => {
      const res = await deleteProjectAction(id);
      setDeleteTarget(null);
      if (res.error) {
        toast.error(res.error, { id: toastId });
      } else {
        setItems((prev) => prev.filter((p) => p.id !== id));
        toast.success("Project deleted successfully", { id: toastId });
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Layout Toggle Bar */}
      <div className="flex justify-between items-center bg-[#0c0c0c] border border-[#262626] p-4 font-mono text-[10px] font-bold uppercase tracking-wider">
        <span className="text-zinc-555">
          {activeLayout === "list" ? "Drag rows to reorder portfolio" : "Grid overview of projects"}
        </span>
        <div className="flex gap-px bg-[#262626]">
          <button
            type="button"
            onClick={() => setLayout("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 transition-colors",
              activeLayout === "list"
                ? "bg-[#F59E0B] text-black"
                : "bg-[#080808]/80 text-zinc-500 hover:text-white"
            )}
          >
            <FiList className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
          <button
            type="button"
            onClick={() => setLayout("grid")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 transition-colors",
              activeLayout === "grid"
                ? "bg-[#F59E0B] text-black"
                : "bg-[#080808]/80 text-zinc-500 hover:text-white"
            )}
          >
            <FiGrid className="h-3.5 w-3.5" />
            <span>Grid</span>
          </button>
        </div>
      </div>

      {/* LIST VIEW (With Drag and Drop) */}
      {activeLayout === "list" && (
        <div className="border border-[#262626] bg-[#0c0c0c]">
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <ul className="divide-y divide-[#262626]">
                {items.map((project) => (
                  <SortableRow
                    key={project.id}
                    project={project}
                    onDeleteRequest={(id, title) => setDeleteTarget({ id, title })}
                    disabled={isPending}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          {items.length === 0 ? (
            <p className="py-12 text-center font-mono text-xs text-zinc-650 uppercase">No projects yet</p>
          ) : null}
        </div>
      )}

      {/* GRID VIEW */}
      {activeLayout === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((project) => (
            <div
              key={project.id}
              className="border border-[#262626] bg-[#0c0c0c] p-5 flex flex-col justify-between font-mono text-xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-white text-sm line-clamp-1">{project.title}</h4>
                  {project.featured && (
                    <span className="border border-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 text-[8px] font-bold text-[#F59E0B] uppercase shrink-0">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500">/{project.slug}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="border border-zinc-800 bg-zinc-900/60 px-1.5 py-0.5 text-[9px] text-zinc-400"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2 font-bold uppercase tracking-wider text-[10px] text-center">
                <Link
                  href={`/admin/projects/${project.id}/edit`}
                  className="flex items-center justify-center gap-1.5 border border-[#262626] bg-black/30 py-2 text-zinc-300 hover:border-[#F59E0B] hover:text-[#F59E0B] transition-colors"
                >
                  <FiEdit3 className="h-3 w-3" />
                  <span>Edit</span>
                </Link>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setDeleteTarget({ id: project.id, title: project.title })}
                  className="flex items-center justify-center gap-1.5 border border-red-500/30 bg-red-500/5 py-2 text-red-450 hover:border-red-550 hover:bg-red-550/15 transition-colors disabled:opacity-30"
                >
                  <FiTrash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 ? (
            <div className="col-span-full border border-[#262626] bg-[#0c0c0c] py-12 text-center font-mono text-xs text-zinc-650 uppercase">
              No projects yet
            </div>
          ) : null}
        </div>
      )}

      {/* Editorial Delete Confirmation Modal */}
      <EditorialModal
        isOpen={deleteTarget !== null}
        type="danger"
        title="Delete Project?"
        description={`Are you sure you want to delete the project "${deleteTarget?.title}"? This action is permanent and cannot be undone.`}
        confirmLabel="Delete Project"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
