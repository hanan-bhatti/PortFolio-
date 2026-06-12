"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { deleteProjectAction, reorderProjectsAction } from "@/lib/actions";

export interface AdminProjectRow {
  id: string;
  title: string;
  slug: string;
  featured: boolean;
  techStack: string[];
}

function SortableRow({ project, onDelete, disabled }: { project: AdminProjectRow; onDelete: (id: string, title: string) => void; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 border-b border-white/5 bg-[#0d0d14] px-4 py-3 ${isDragging ? "z-10 opacity-80" : ""}`}
    >
      <button type="button" {...attributes} {...listeners} className="cursor-grab text-zinc-600 hover:text-zinc-300" title="Drag to reorder">
        ☰
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-200">
          {project.title}
          {project.featured ? <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">Featured</span> : null}
        </p>
        <p className="truncate text-xs text-zinc-600">/{project.slug} · {project.techStack.join(", ")}</p>
      </div>
      <Link href={`/admin/projects/${project.id}/edit`} className="text-sm text-indigo-400 hover:underline">
        Edit
      </Link>
      <button type="button" disabled={disabled} onClick={() => onDelete(project.id, project.title)} className="text-sm text-red-400 hover:underline disabled:opacity-50">
        Delete
      </button>
    </li>
  );
}

export default function ProjectsManager({ initial }: { initial: AdminProjectRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [isPending, startTransition] = useTransition();

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
      else toast.success("Order saved");
    });
  };

  const onDelete = (id: string, title: string): void => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    startTransition(async () => {
      const res = await deleteProjectAction(id);
      if (res.error) toast.error(res.error);
      else {
        setItems((prev) => prev.filter((p) => p.id !== id));
        toast.success("Project deleted");
        router.refresh();
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul>
            {items.map((project) => (
              <SortableRow key={project.id} project={project} onDelete={onDelete} disabled={isPending} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {items.length === 0 ? <p className="px-4 py-10 text-center text-sm text-zinc-600">No projects yet.</p> : null}
    </div>
  );
}
