"use client";

import { Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { FiCalendar, FiClock, FiLink } from "react-icons/fi";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  notes: string | null;
  type?: string;
  blogId?: string | null;
}

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

export default function TaskCard({ task, index, onClick }: TaskCardProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
  const isToday = task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString() && task.status !== "done";

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "p-3 bg-[#0c0c0c] border select-none transition-all group flex items-start gap-2.5 rounded-none relative",
            snapshot.isDragging ? "border-amber shadow-2xl scale-[1.01]" : "border-[#262626] hover:border-zinc-700"
          )}
        >
          {/* Drag Handle */}
          <div
            {...provided.dragHandleProps}
            className="text-zinc-650 hover:text-zinc-400 cursor-grab active:cursor-grabbing p-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Drag task"
          >
            ⠿
          </div>

          {/* Task Info */}
          <div className="flex-1 min-w-0" onClick={onClick}>
            <h5 className="text-xs font-sans font-semibold text-zinc-200 line-clamp-2 leading-relaxed cursor-pointer hover:text-amber transition-colors">
              {task.title}
            </h5>

            {/* Badges container */}
            <div className="flex flex-wrap gap-1.5 mt-2.5 items-center">
              {/* Priority */}
              <span
                className={cn(
                  "px-1.5 py-0.5 border text-[7px] font-mono uppercase font-bold tracking-wide",
                  task.priority === "urgent" && "border-red-500/20 bg-red-500/5 text-red-400 animate-pulse",
                  task.priority === "high" && "border-amber/20 bg-amber/5 text-amber",
                  task.priority === "medium" && "border-blue-500/20 bg-blue-500/5 text-blue-450",
                  task.priority === "low" && "border-zinc-700 bg-zinc-800/40 text-zinc-450"
                )}
              >
                {task.priority}
              </span>

              {/* Due Date */}
              {task.dueDate && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 border text-[7px] font-mono uppercase font-bold flex items-center gap-1",
                    isOverdue
                      ? "border-red-500/30 bg-red-500/10 text-red-450"
                      : isToday
                      ? "border-amber/35 bg-amber/10 text-amber-300"
                      : "border-zinc-800 text-zinc-500"
                  )}
                >
                  <FiCalendar className="h-2.5 w-2.5 shrink-0" />
                  {new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
