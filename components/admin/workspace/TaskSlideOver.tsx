"use client";

import { useEffect, useState } from "react";
import { FiX, FiTrash2, FiClock } from "react-icons/fi";
import { cn } from "@/lib/utils";
import InfoTooltip from "../InfoTooltip";

interface Task {
  id: string;
  title: string;
  status: string; // backlog | todo | in-progress | done
  priority: string; // low | medium | high | urgent
  dueDate: string | null;
  notes: string | null;
}

interface TaskSlideOverProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, fields: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

export default function TaskSlideOver({ task, isOpen, onClose, onSave, onDelete }: TaskSlideOverProps) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setStatus(task.status || "todo");
      setPriority(task.priority || "medium");
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] || "" : "");
      setNotes(task.notes || "");
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleBlur = (field: keyof Task, value: any) => {
    onSave(task.id, { [field]: value });
  };

  const handleSelectChange = (field: keyof Task, value: any) => {
    onSave(task.id, { [field]: value });
  };

  return (
    <>
      {/* Backdrop blur click target */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity" onClick={onClose} />

      {/* Main Drawer Container */}
      <div className="fixed top-0 right-0 h-full w-[385px] bg-[#0c0c0c] border-l border-[#262626] shadow-2xl p-6 z-50 flex flex-col justify-between animate-slideIn select-none">
        
        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <span className="font-mono text-[9px] font-bold text-zinc-550 uppercase tracking-widest flex items-center gap-1.5">
              <FiClock className="h-3.5 w-3.5 text-amber" /> Task Details
            </span>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
              <FiX className="h-4 w-4" />
            </button>
          </div>

          {/* Form Content */}
          <div className="space-y-4 font-mono text-[11px] text-zinc-400">
            {/* Title */}
            <div>
              <label className="flex items-center gap-1 text-[9px] font-bold text-zinc-550 uppercase mb-1">
                Task Title
                <InfoTooltip content="The name of this workspace task." />
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  onSave(task.id, { title: e.target.value });
                }}
                className="w-full bg-black/40 border border-[#262626] p-2.5 text-xs text-white outline-none focus:border-amber rounded-none font-sans font-bold"
              />
            </div>

            {/* Status & Priority Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1 text-[9px] font-bold text-zinc-550 uppercase mb-1">
                  Status
                  <InfoTooltip content="The progression state of this task (backlog, todo, in progress, done)." />
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    handleSelectChange("status", e.target.value);
                  }}
                  className="w-full bg-[#0c0c0c] border border-[#262626] p-2 outline-none text-white focus:border-amber rounded-none text-xs"
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">Todo</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1 text-[9px] font-bold text-zinc-550 uppercase mb-1">
                  Priority
                  <InfoTooltip content="Set a severity priority level for this task." />
                </label>
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value);
                    handleSelectChange("priority", e.target.value);
                  }}
                  className="w-full bg-[#0c0c0c] border border-[#262626] p-2 outline-none text-white focus:border-amber rounded-none text-xs"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="flex items-center gap-1 text-[9px] font-bold text-zinc-550 uppercase mb-1">
                Due Date
                <InfoTooltip content="Select a due date for completion." />
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  onSave(task.id, { dueDate: e.target.value ? new Date(e.target.value).toISOString() : null });
                }}
                className="w-full bg-black/40 border border-[#262626] p-2 outline-none text-white focus:border-amber rounded-none text-xs"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-1 text-[9px] font-bold text-zinc-550 uppercase mb-1">
                Notes
                <InfoTooltip content="Extra details, logs, or description blocks for this task." />
              </label>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  onSave(task.id, { notes: e.target.value });
                }}
                rows={8}
                placeholder="Write markdown notes or checklist summaries..."
                className="w-full bg-black/45 border border-[#262626] p-2.5 text-xs text-white outline-none focus:border-amber rounded-none font-sans leading-relaxed resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[#262626] pt-4 flex justify-between items-center">
          <button
            onClick={() => {
              if (confirm("Delete this task?")) {
                onDelete(task.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 border border-red-500/20 bg-red-500/5 hover:border-red-500 hover:text-red-400 font-mono text-[9px] font-bold uppercase px-3.5 py-2 transition-colors rounded-none"
          >
            <FiTrash2 className="h-3.5 w-3.5" /> Delete
          </button>
          
          <button
            onClick={onClose}
            className="border border-[#262626] bg-black/40 hover:border-zinc-500 font-mono text-[9px] font-bold uppercase px-4 py-2 transition-colors text-zinc-400 hover:text-white rounded-none"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
