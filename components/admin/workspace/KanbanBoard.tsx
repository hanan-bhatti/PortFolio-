"use client";

import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useState } from "react";
import TaskCard from "./TaskCard";
import TaskSlideOver from "./TaskSlideOver";
import { FiPlus, FiCheckCircle } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  status: string; // backlog | todo | in-progress | done
  priority: string;
  dueDate: string | null;
  notes: string | null;
}

interface KanbanBoardProps {
  tasks: Task[];
  pageId: string;
  onReorder: (taskId: string, status: string, order: number, allTaskIds: string[]) => void;
  onAddTask: (title: string, status: string) => void;
  onUpdateTask: (id: string, fields: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

const COLUMNS = [
  { id: "backlog", title: "Backlog", color: "border-zinc-700 text-zinc-400" },
  { id: "todo", title: "Todo", color: "border-blue-500/30 text-blue-400" },
  { id: "in-progress", title: "In Progress", color: "border-amber/35 text-amber" },
  { id: "done", title: "Done", color: "border-[#16A34A]/30 text-[#16A34A]" }
];

export default function KanbanBoard({ tasks, pageId, onReorder, onAddTask, onUpdateTask, onDeleteTask }: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Inline add states
  const [activeInputColumn, setActiveInputColumn] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    // Filter tasks in destination column
    const colTasks = tasks.filter((t) => t.status === destCol && t.id !== draggableId);
    
    // Sort columns by their current database order
    // (Here we sort tasks locally, insert the draggableId at destination index)
    const taskIds = colTasks.map((t) => t.id);
    taskIds.splice(destination.index, 0, draggableId);

    // Call update handler
    onReorder(draggableId, destCol, destination.index, taskIds);
  };

  const handleAddSubmit = (status: string) => {
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle, status);
    setNewTaskTitle("");
    setActiveInputColumn(null);
  };

  return (
    <div className="space-y-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid gap-4 md:grid-cols-4 select-none">
          {COLUMNS.map((col) => {
            const colTasks = tasks
              .filter((t) => t.status === col.id)
              // Sort locally by some ordering (we can map to database position or database index)
              .sort((a, b) => (a as any).order - (b as any).order);

            return (
              <div key={col.id} className="bg-black/35 p-3.5 border border-[#262626] min-h-[480px] flex flex-col justify-between">
                <div>
                  {/* Column Header */}
                  <div className="flex items-center justify-between border-b border-[#262626] pb-2.5 mb-4">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-mono text-[9px] font-bold uppercase tracking-wider", col.color)}>
                        {col.title}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-550 bg-zinc-900/60 px-1.5 py-0.5">
                        {colTasks.length}
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveInputColumn(col.id)}
                      className="text-zinc-500 hover:text-white transition-colors"
                      title="Add task"
                    >
                      <FiPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Droppable Area */}
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "space-y-2 min-h-[350px] transition-colors pb-12",
                          snapshot.isDraggingOver && "bg-zinc-900/10"
                        )}
                      >
                        {colTasks.map((task, idx) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={idx}
                            onClick={() => setSelectedTask(task)}
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* Column Footer / Inline Add Form */}
                <div>
                  {activeInputColumn === col.id ? (
                    <div className="border border-[#262626] p-2 bg-black/45 mt-2">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Task title..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddSubmit(col.id);
                          if (e.key === "Escape") setActiveInputColumn(null);
                        }}
                        className="w-full bg-transparent border-none text-xs text-white outline-none font-mono placeholder-zinc-650"
                      />
                      <div className="flex justify-end gap-1.5 mt-2 font-mono text-[8px] font-bold uppercase">
                        <button onClick={() => setActiveInputColumn(null)} className="text-zinc-500 hover:text-white px-1">Cancel</button>
                        <button onClick={() => handleAddSubmit(col.id)} className="text-amber hover:underline px-1">Save</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveInputColumn(col.id)}
                      className="w-full py-2 border border-dashed border-[#262626] hover:border-zinc-700 transition-colors text-center font-mono text-[9px] font-bold text-zinc-500 uppercase flex items-center justify-center gap-1 mt-2"
                    >
                      <FiPlus className="h-3 w-3" /> Add Task
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Task Edit Slideover */}
      <TaskSlideOver
        task={selectedTask}
        isOpen={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        onSave={onUpdateTask}
        onDelete={onDeleteTask}
      />
    </div>
  );
}
