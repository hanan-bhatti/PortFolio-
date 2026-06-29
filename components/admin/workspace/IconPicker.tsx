"use client";

import { useState } from "react";
import {
  FiFileText,
  FiFolder,
  FiEdit,
  FiTerminal,
  FiBookmark,
  FiActivity,
  FiSettings,
  FiGrid,
  FiCpu,
  FiBriefcase
} from "react-icons/fi";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  currentIcon: string; // e.g. "file" | "folder" | "edit" | "terminal" | "bookmark"
  onSelect: (iconName: string) => void;
  className?: string;
}

export const ICON_MAP: { [key: string]: any } = {
  file: FiFileText,
  folder: FiFolder,
  edit: FiEdit,
  terminal: FiTerminal,
  bookmark: FiBookmark,
  activity: FiActivity,
  settings: FiSettings,
  grid: FiGrid,
  cpu: FiCpu,
  briefcase: FiBriefcase
};

export default function IconPicker({ currentIcon, onSelect, className }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  // Fallback to file icon
  const IconComponent = ICON_MAP[currentIcon] || FiFileText;

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xl text-amber hover:bg-zinc-900 p-2 border border-transparent hover:border-[#262626] transition-all rounded-none outline-none flex items-center justify-center h-10 w-10 shrink-0"
        title="Select page icon"
      >
        <IconComponent className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 p-3 bg-[#0c0c0c] border border-[#262626] grid grid-cols-5 gap-2 z-50 w-[180px] animate-fadeIn rounded-none shadow-xl">
            {Object.keys(ICON_MAP).map((name) => {
              const ItemIcon = ICON_MAP[name];
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onSelect(name);
                    setOpen(false);
                  }}
                  className={cn(
                    "p-2 hover:bg-zinc-800 transition-colors rounded-none outline-none text-zinc-400 hover:text-white flex items-center justify-center",
                    currentIcon === name && "bg-amber/15 border border-amber/35 text-amber"
                  )}
                  title={name}
                >
                  <ItemIcon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
