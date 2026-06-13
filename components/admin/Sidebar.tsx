"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions";
import {
  FiGrid,
  FiBarChart2,
  FiEdit3,
  FiFolder,
  FiCamera,
  FiUser,
  FiCpu,
  FiBriefcase,
  FiFileText,
  FiMail,
  FiSettings,
} from "react-icons/fi";

interface SidebarItem {
  href: string;
  label: string;
  icon: any;
  badge?: boolean;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const SECTIONS: SidebarSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: FiGrid },
      { href: "/admin/analytics", label: "Analytics", icon: FiBarChart2 },
    ],
  },
  {
    title: "CONTENT",
    items: [
      { href: "/admin/posts", label: "Posts", icon: FiEdit3 },
      { href: "/admin/projects", label: "Projects", icon: FiFolder },
      { href: "/admin/photography", label: "Photography", icon: FiCamera },
    ],
  },
  {
    title: "PERSONAL",
    items: [
      { href: "/admin/about", label: "About", icon: FiUser },
      { href: "/admin/skills", label: "Skills", icon: FiCpu },
      { href: "/admin/experience", label: "Experience", icon: FiBriefcase },
      { href: "/admin/resume", label: "Resume", icon: FiFileText },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { href: "/admin/messages", label: "Messages", icon: FiMail, badge: true },
      { href: "/admin/settings", label: "Settings", icon: FiSettings },
    ],
  },
];

export default function Sidebar({ unreadCount, userEmail }: { unreadCount: number; userEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[#262626] bg-[#080808]">
      {/* Header / Brand */}
      <div className="flex items-center gap-3 border-b border-[#262626] px-5 py-6">
        <div className="flex h-8 w-8 items-center justify-center border border-[#10B981] bg-[#10B981]/10 text-xs font-bold font-mono text-[#10B981]">
          HB
        </div>
        <Link href="/admin/dashboard" className="font-syne text-base font-bold text-white tracking-wider uppercase">
          Admin
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 space-y-6">
        {SECTIONS.map((section, idx) => (
          <div key={section.title} className="space-y-1">
            <p className={cn(
              "px-4 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2",
              idx > 0 ? "mt-2" : "mt-0"
            )}>
              {section.title}
            </p>
            {section.items.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between px-4 py-2 text-[13px] font-sans font-medium transition-all duration-150 border-l-2",
                    isActive
                      ? "border-[#F59E0B] bg-[#F59E0B]/5 text-white"
                      : "border-transparent text-zinc-400 hover:bg-white/[0.02] hover:text-white"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={cn(
                      "h-4 w-4 shrink-0 transition-colors duration-150",
                      isActive ? "text-[#F59E0B]" : "text-zinc-500 group-hover:text-zinc-300"
                    )} />
                    <span>{item.label}</span>
                  </span>
                  {item.badge && unreadCount > 0 ? (
                    <span className="flex h-5 items-center justify-center bg-[#10B981] px-1.5 font-mono text-[10px] font-bold text-black min-w-[20px]">
                      {unreadCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Profile Section */}
      <div className="flex items-center gap-3 border-t border-[#262626] p-4 bg-black/20">
        <span className="flex h-8 w-8 items-center justify-center border border-[#F59E0B] bg-[#F59E0B]/10 text-xs font-bold text-[#F59E0B] shrink-0">
          {userEmail.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-xs font-medium text-zinc-400">{userEmail}</p>
          <form action={logoutAction}>
            <button type="submit" className="font-mono text-[10px] text-red-400 hover:text-red-300 uppercase tracking-wider transition-colors mt-0.5">
              LOG OUT →
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
