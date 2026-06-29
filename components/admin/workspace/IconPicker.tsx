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
  FiBriefcase,
  FiStar,
  FiZap,
  FiHeart,
  FiImage,
  FiPlay,
  FiMusic,
  FiVideo,
  FiDatabase,
  FiMail,
  FiCalendar,
  FiClock,
  FiCompass,
  FiBook,
  FiCode,
  FiLayers,
  FiUser,
  FiUsers,
  FiMapPin,
  FiGlobe,
  FiHelpCircle,
  FiLock,
  FiUnlock,
  FiKey,
  FiCheckCircle,
  FiTrendingUp,
  FiHash,
  FiCloud,
  FiCamera,
  FiSend,
  FiTrash2,
  FiTool,
  FiInfo,
  FiSliders,
  FiPieChart
} from "react-icons/fi";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  currentIcon: string;
  onSelect: (iconName: string) => void;
  className?: string;
}

export const ICON_LIST = [
  { name: "file", icon: FiFileText, color: "text-zinc-450 hover:text-zinc-300" },
  { name: "folder", icon: FiFolder, color: "text-[#F59E0B] hover:text-amber-400" },
  { name: "edit", icon: FiEdit, color: "text-sky-400 hover:text-sky-300" },
  { name: "terminal", icon: FiTerminal, color: "text-[#16A34A] hover:text-green-400" },
  { name: "bookmark", icon: FiBookmark, color: "text-pink-400 hover:text-pink-300" },
  { name: "activity", icon: FiActivity, color: "text-rose-450 hover:text-rose-400" },
  { name: "settings", icon: FiSliders, color: "text-indigo-400 hover:text-indigo-300" },
  { name: "grid", icon: FiGrid, color: "text-teal-400 hover:text-teal-300" },
  { name: "cpu", icon: FiCpu, color: "text-cyan-400 hover:text-cyan-300" },
  { name: "briefcase", icon: FiBriefcase, color: "text-emerald-400 hover:text-emerald-300" },
  { name: "star", icon: FiStar, color: "text-yellow-400 hover:text-yellow-300" },
  { name: "zap", icon: FiZap, color: "text-orange-400 hover:text-orange-300" },
  { name: "heart", icon: FiHeart, color: "text-red-400 hover:text-red-350" },
  { name: "image", icon: FiImage, color: "text-violet-400 hover:text-violet-300" },
  { name: "play", icon: FiPlay, color: "text-green-500 hover:text-green-400" },
  { name: "music", icon: FiMusic, color: "text-pink-500 hover:text-pink-400" },
  { name: "video", icon: FiVideo, color: "text-rose-500 hover:text-rose-400" },
  { name: "database", icon: FiDatabase, color: "text-blue-400 hover:text-blue-300" },
  { name: "mail", icon: FiMail, color: "text-sky-500 hover:text-sky-400" },
  { name: "calendar", icon: FiCalendar, color: "text-amber-500 hover:text-amber-400" },
  { name: "clock", icon: FiClock, color: "text-teal-500 hover:text-teal-450" },
  { name: "compass", icon: FiCompass, color: "text-cyan-500 hover:text-cyan-400" },
  { name: "book", icon: FiBook, color: "text-zinc-300 hover:text-white" },
  { name: "code", icon: FiCode, color: "text-violet-500 hover:text-violet-450" },
  { name: "layers", icon: FiLayers, color: "text-indigo-500 hover:text-indigo-400" },
  { name: "user", icon: FiUser, color: "text-orange-500 hover:text-orange-400" },
  { name: "users", icon: FiUsers, color: "text-emerald-500 hover:text-emerald-450" },
  { name: "map-pin", icon: FiMapPin, color: "text-red-500 hover:text-red-400" },
  { name: "globe", icon: FiGlobe, color: "text-blue-550 hover:text-blue-400" },
  { name: "help", icon: FiHelpCircle, color: "text-zinc-500 hover:text-zinc-400" },
  { name: "lock", icon: FiLock, color: "text-red-600 hover:text-red-500" },
  { name: "unlock", icon: FiUnlock, color: "text-green-600 hover:text-green-500" },
  { name: "key", icon: FiKey, color: "text-amber-600 hover:text-amber-500" },
  { name: "check", icon: FiCheckCircle, color: "text-emerald-600 hover:text-emerald-555" },
  { name: "trending", icon: FiTrendingUp, color: "text-emerald-400 hover:text-emerald-350" },
  { name: "hash", icon: FiHash, color: "text-zinc-500 hover:text-zinc-400" },
  { name: "cloud", icon: FiCloud, color: "text-sky-350 hover:text-sky-300" },
  { name: "camera", icon: FiCamera, color: "text-pink-600 hover:text-pink-500" },
  { name: "send", icon: FiSend, color: "text-teal-600 hover:text-teal-500" },
  { name: "trash", icon: FiTrash2, color: "text-red-500 hover:text-red-400" },
  { name: "tool", icon: FiTool, color: "text-orange-600 hover:text-orange-500" },
  { name: "info", icon: FiInfo, color: "text-blue-500 hover:text-blue-400" },
  { name: "sliders", icon: FiSliders, color: "text-indigo-600 hover:text-[#c792ea]" },
  { name: "chart", icon: FiPieChart, color: "text-amber-400 hover:text-amber-300" }
];

export const ICON_MAP: { [key: string]: any } = ICON_LIST.reduce((acc, curr) => {
  acc[curr.name] = curr.icon;
  return acc;
}, {} as { [key: string]: any });

export default function IconPicker({ currentIcon, onSelect, className }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  const activeItem = (ICON_LIST.find(i => i.name === currentIcon) || ICON_LIST[0]) as typeof ICON_LIST[0];
  const ActiveIcon = activeItem.icon;

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xl hover:bg-zinc-900/60 p-2 border border-transparent hover:border-[#262626] transition-all rounded-none outline-none flex items-center justify-center h-12 w-12 shrink-0 select-none cursor-pointer"
        title="Select page icon"
      >
        <ActiveIcon className={cn("h-6 w-6 transition-transform hover:scale-105 duration-150", activeItem.color.split(" ")[0])} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 p-3 bg-[#0c0c0c] border border-[#262626] grid grid-cols-6 gap-2.5 z-50 w-[260px] animate-fadeIn rounded-none shadow-2xl max-h-[300px] overflow-y-auto scrollbar-thin">
            {ICON_LIST.map((item) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    onSelect(item.name);
                    setOpen(false);
                  }}
                  className={cn(
                    "p-2 hover:bg-zinc-900 transition-all rounded-none outline-none flex items-center justify-center border border-transparent select-none cursor-pointer",
                    currentIcon === item.name && "bg-amber/15 border-amber/35"
                  )}
                  title={item.name}
                >
                  <ItemIcon className={cn("h-5 w-5 transition-transform hover:scale-110 duration-150", item.color)} />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
