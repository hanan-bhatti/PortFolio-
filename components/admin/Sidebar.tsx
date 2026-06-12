"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "\u25a6" },
  { href: "/admin/posts", label: "Posts", icon: "\u270e" },
  { href: "/admin/projects", label: "Projects", icon: "\u2756" },
  { href: "/admin/messages", label: "Messages", icon: "\u2709" },
  { href: "/admin/settings", label: "Settings", icon: "\u2699" },
] as const;

export default function Sidebar({ unreadCount, userEmail }: { unreadCount: number; userEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-[#0a0a12]">
      <div className="border-b border-white/10 p-5">
        <Link href="/admin/dashboard" className="text-lg font-bold text-white">
          Admin<span className="text-indigo-400">.</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
              pathname.startsWith(item.href)
                ? "bg-indigo-600/20 text-indigo-300"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <span>
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </span>
            {item.href === "/admin/messages" && unreadCount > 0 ? (
              <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-xs font-semibold text-black">
                {unreadCount}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3 border-t border-white/10 p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
          {userEmail.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-zinc-400">{userEmail}</p>
          <form action={logoutAction}>
            <button type="submit" className="text-xs text-red-400 hover:underline">
              Log out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
