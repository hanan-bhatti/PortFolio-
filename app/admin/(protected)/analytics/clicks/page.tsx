/**
 * @file app/admin/(protected)/analytics/clicks/page.tsx
 * @description Admin page for viewing tracked links, share button clicks, and code copy statistics.
 * 
 * @exports
 * - AnalyticsInteractionsPage (default): Main React component or function
 * - dynamic: Constant / Helper
 */

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsInteractionsPage() {
  const [shortLinks, copyEvents, totalCopies] = await Promise.all([
    prisma.shortLink.findMany({
      include: {
        post: { select: { title: true } },
        clicks: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.codeCopyEvent.findMany({
      include: {
        post: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.codeCopyEvent.count(),
  ]);

  // Aggregate metrics
  const totalLinkClicks = shortLinks
    .filter((l) => l.type === "link")
    .reduce((sum, l) => sum + l.clicks.length, 0);

  const totalShareClicks = shortLinks
    .filter((l) => l.type === "share")
    .reduce((sum, l) => sum + l.clicks.length, 0);

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Analytics — Interactions"
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Analytics", href: "/admin/analytics" },
          { label: "Interactions" },
        ]}
      />

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#262626] pb-4">
        <Link
          href="/admin/analytics"
          className="text-xs font-mono font-bold text-zinc-500 hover:text-white transition-colors pb-1"
        >
          TRAFFIC OVERVIEW
        </Link>
        <Link
          href="/admin/analytics/clicks"
          className="text-xs font-mono font-bold text-amber border-b-2 border-amber pb-1"
        >
          INTERACTIONS & CLICKS
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Total Code Copies
          </p>
          <p className="mt-2 font-mono text-3xl font-bold text-white">{totalCopies}</p>
        </div>
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            External Link Clicks
          </p>
          <p className="mt-2 font-mono text-3xl font-bold text-[#16A34A]">{totalLinkClicks}</p>
        </div>
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Share Link Clicks
          </p>
          <p className="mt-2 font-mono text-3xl font-bold text-amber">{totalShareClicks}</p>
        </div>
      </div>

      {/* Grid Layout for Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tracked Short Links Table */}
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-6 space-y-4">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400">
            Tracked Short Links
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#262626] text-zinc-500">
                  <th className="pb-2 font-bold uppercase tracking-wider">Code</th>
                  <th className="pb-2 font-bold uppercase tracking-wider">Post Context</th>
                  <th className="pb-2 font-bold uppercase tracking-wider">Clicks</th>
                  <th className="pb-2 font-bold uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {shortLinks.length > 0 ? (
                  shortLinks.map((link) => (
                    <tr key={link.id} className="text-zinc-300 hover:bg-white/[0.01]">
                      <td className="py-2.5 font-bold text-amber">
                        <a
                          href={`/s/${link.code}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          /s/{link.code}
                        </a>
                      </td>
                      <td className="py-2.5 max-w-[200px] truncate text-zinc-400" title={link.post?.title || "Global"}>
                        {link.post?.title || "Global"}
                      </td>
                      <td className="py-2.5 font-bold text-white">{link.clicks.length}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            link.type === "share"
                              ? "bg-amber/10 text-amber border border-amber/20"
                              : "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20"
                          }`}
                        >
                          {link.type}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-zinc-650">
                      No tracked links generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Code Copies Log Table */}
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-6 space-y-4">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400">
            Recent Code Copies Log
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#262626] text-zinc-500">
                  <th className="pb-2 font-bold uppercase tracking-wider">Post</th>
                  <th className="pb-2 font-bold uppercase tracking-wider">Block ID</th>
                  <th className="pb-2 font-bold uppercase tracking-wider">Type</th>
                  <th className="pb-2 font-bold uppercase tracking-wider">Preview</th>
                  <th className="pb-2 font-bold uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {copyEvents.length > 0 ? (
                  copyEvents.map((event) => (
                    <tr key={event.id} className="text-zinc-300 hover:bg-white/[0.01]">
                      <td className="py-2.5 max-w-[150px] truncate text-zinc-400" title={event.post?.title || "Unknown"}>
                        {event.post?.title || "Unknown"}
                      </td>
                      <td className="py-2.5 font-mono text-[10px] text-amber">
                        {event.codeBlockId || "—"}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            event.isMultiline
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          }`}
                        >
                          {event.isMultiline ? "multiline" : "inline"}
                        </span>
                      </td>
                      <td className="py-2.5 max-w-[200px] truncate">
                        <code className="text-zinc-400 bg-black/40 px-1 py-0.5 text-[10px]">
                          {event.codeBlock.trim().slice(0, 40)}
                          {event.codeBlock.length > 40 && "..."}
                        </code>
                      </td>
                      <td className="py-2.5 text-zinc-500 text-[10px]">
                        {formatDate(event.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-zinc-650">
                      No code copies recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
