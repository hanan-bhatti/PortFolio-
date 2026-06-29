"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions";
import {
  FiGrid,
  FiBarChart2,
  FiActivity,
  FiEdit3,
  FiFolder,
  FiCamera,
  FiUser,
  FiCpu,
  FiBriefcase,
  FiFileText,
  FiMail,
  FiSettings,
  FiMenu,
  FiX,
  FiTrendingUp,
  FiSend,
  FiLayout,
  FiLayers,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut
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
      { href: "/admin/analytics/clicks", label: "Interactions", icon: FiActivity },
      { href: "/admin/engagement", label: "Engagement", icon: FiTrendingUp },
    ],
  },
  {
    title: "WORKSPACE",
    items: [
      { href: "/admin/workspace", label: "Workspace", icon: FiLayout },
      { href: "/admin/canvas", label: "Canvas", icon: FiLayers },
    ],
  },
  {
    title: "CONTENT",
    items: [
      { href: "/admin/posts", label: "Posts", icon: FiEdit3 },
      { href: "/admin/projects", label: "Projects", icon: FiFolder },
      { href: "/admin/photography", label: "Photography", icon: FiCamera },
      { href: "/admin/newsletter", label: "Newsletter", icon: FiSend },
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
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load initial collapse state from localStorage client-side
  useEffect(() => {
    const saved = localStorage.getItem("admin_sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("admin_sidebar_collapsed", String(nextState));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Header Bar */}
      <div className="flex h-16 w-full items-center justify-between border-b border-[#262626] bg-[#080808] px-4 md:hidden shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center border border-[#10B981] bg-[#10B981]/10 text-xs font-bold font-mono text-[#10B981]">
            HB
          </div>
          <Link href="/admin/dashboard" className="font-syne text-base font-bold text-white tracking-wider uppercase">
            Admin
          </Link>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-10 w-10 items-center justify-center border border-[#262626] text-zinc-400 hover:text-white transition-colors rounded-none"
          aria-label="Open menu"
        >
          <FiMenu className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop / Tablet Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#262626] bg-[#080808] transition-all duration-300 ease-in-out rounded-none select-none",
        isCollapsed ? "w-16" : "w-64",
        "translate-x-full md:relative md:translate-x-0 md:shrink-0 md:left-auto md:top-auto md:bottom-auto",
        isOpen && "translate-x-0 w-64"
      )}>
        {/* Header / Brand */}
        <div className={cn(
          "flex items-center border-b border-[#262626] py-5 px-4",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#10B981] bg-[#10B981]/10 text-xs font-bold font-mono text-[#10B981]">
              HB
            </div>
            {!isCollapsed && (
              <Link href="/admin/dashboard" onClick={() => setIsOpen(false)} className="font-syne text-base font-bold text-white tracking-wider uppercase truncate">
                Admin
              </Link>
            )}
          </div>
          
          {/* Collapse toggle button on desktop */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex h-7 w-7 items-center justify-center border border-[#262626] text-zinc-450 hover:text-white transition-colors rounded-none"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <FiChevronRight className="h-4 w-4" /> : <FiChevronLeft className="h-4 w-4" />}
          </button>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsOpen(false)}
            className="flex md:hidden h-8 w-8 items-center justify-center border border-[#262626] text-zinc-400 hover:text-white transition-colors rounded-none"
            aria-label="Close menu"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 space-y-5 scrollbar-thin">
          {SECTIONS.map((section, idx) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed ? (
                <p className={cn(
                  "px-4 text-[9px] font-mono font-bold text-zinc-550 uppercase tracking-[0.2em] mb-2",
                  idx > 0 ? "mt-2" : "mt-0"
                )}>
                  {section.title}
                </p>
              ) : (
                <div className="h-px bg-[#262626]/40 my-3 mx-4" />
              )}
              
              {section.items.map((item) => {
                const isActive =
                  item.href === "/admin/analytics"
                    ? pathname === "/admin/analytics"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "group flex items-center justify-between py-2 text-[13px] font-sans font-medium transition-all duration-150 border-l-2 rounded-none",
                      isActive
                        ? "border-[#F59E0B] bg-[#F59E0B]/5 text-white"
                        : "border-transparent text-zinc-400 hover:bg-white/[0.02] hover:text-white",
                      isCollapsed ? "px-0 justify-center border-l-0" : "px-4"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={cn(
                        "h-4 w-4 shrink-0 transition-colors duration-150",
                        isActive ? "text-[#F59E0B]" : "text-zinc-500 group-hover:text-zinc-300"
                      )} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </span>
                    {!isCollapsed && item.badge && unreadCount > 0 ? (
                      <span className="flex h-5 items-center justify-center bg-[#10B981] px-1.5 font-mono text-[10px] font-bold text-black min-w-[20px] rounded-none">
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
        <div className={cn(
          "flex items-center border-t border-[#262626] p-4 bg-black/20",
          isCollapsed ? "justify-center" : "gap-3"
        )}>
          <span className="flex h-8 w-8 items-center justify-center border border-[#F59E0B] bg-[#F59E0B]/10 text-xs font-bold text-[#F59E0B] shrink-0 rounded-none">
            {userEmail.charAt(0).toUpperCase()}
          </span>
          {!isCollapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-xs font-medium text-zinc-450">{userEmail}</p>
              <form action={logoutAction}>
                <button type="submit" className="font-mono text-[9px] text-red-500 hover:text-red-400 uppercase tracking-wider transition-colors mt-0.5 rounded-none outline-none">
                  LOG OUT →
                </button>
              </form>
            </div>
          ) : (
            <form action={logoutAction} className="inline-block">
              <button
                type="submit"
                className="text-red-500 hover:text-red-400 transition-colors p-1"
                title="Log out"
              >
                <FiLogOut className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </aside>
    </>
  );
}
