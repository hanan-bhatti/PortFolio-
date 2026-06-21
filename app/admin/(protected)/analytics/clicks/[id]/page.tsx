/**
 * @file app/admin/(protected)/analytics/clicks/[id]/page.tsx
 * @description Detailed admin view displaying click and code copy statistics for a specific blog post.
 * 
 * @exports
 * - PostAnalyticsPage (default): Main React component
 * - dynamic: Constant / Helper
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { formatDate } from "@/lib/utils";
import { UAParser } from "ua-parser-js";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PostAnalyticsPage({ params }: Props) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      shortLinks: {
        include: {
          clicks: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
      codeCopyEvents: {
        include: {
          visitor: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!post) {
    notFound();
  }

  // Calculate stats
  const linkClicks = post.shortLinks
    .filter((l) => l.type === "link")
    .reduce((sum, l) => sum + l.clicks.length, 0);

  const shareLink = post.shortLinks.find((l) => l.type === "share");
  const shareClicks = shareLink ? shareLink.clicks.length : 0;
  const codeCopies = post.codeCopyEvents.length;

  // Group copies by block ID
  const blockCopiesMap = post.codeCopyEvents.reduce((acc, event) => {
    const blockId = event.codeBlockId || "unknown";
    if (!acc[blockId]) {
      acc[blockId] = {
        codeBlockId: blockId,
        isMultiline: event.isMultiline,
        codeBlock: event.codeBlock,
        count: 0,
      };
    }
    acc[blockId].count += 1;
    return acc;
  }, {} as Record<string, { codeBlockId: string; isMultiline: boolean; codeBlock: string; count: number }>);

  const blockCopies = Object.values(blockCopiesMap).sort((a, b) => b.count - a.count);

  // Combine click logs
  interface LogItem {
    id: string;
    type: "click" | "copy";
    actionType: string;
    detail: string;
    userAgent: string | null;
    referer: string | null;
    visitorId: string | null;
    createdAt: Date;
  }

  const logs: LogItem[] = [];

  post.shortLinks.forEach((link) => {
    link.clicks.forEach((click) => {
      logs.push({
        id: click.id,
        type: "click",
        actionType: link.type,
        detail: link.targetUrl,
        userAgent: click.userAgent,
        referer: click.referer,
        visitorId: click.visitorId,
        createdAt: click.createdAt,
      });
    });
  });

  post.codeCopyEvents.forEach((event) => {
    logs.push({
      id: event.id,
      type: "copy",
      actionType: event.isMultiline ? "multiline" : "inline",
      detail: event.codeBlockId || "unknown",
      userAgent: null,
      referer: null,
      visitorId: event.visitorId,
      createdAt: event.createdAt,
    });
  });

  // Sort logs by date desc, limit to recent 50
  const recentLogs = logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 50);

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title={post.title}
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Analytics", href: "/admin/analytics" },
          { label: "Interactions", href: "/admin/analytics/clicks" },
          { label: "Detail" },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Total Copies
          </p>
          <p className="mt-2 font-mono text-3xl font-bold text-white">{codeCopies}</p>
        </div>
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            External Links Clicks
          </p>
          <p className="mt-2 font-mono text-3xl font-bold text-[#16A34A]">{linkClicks}</p>
        </div>
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Share Clicks
          </p>
          <p className="mt-2 font-mono text-3xl font-bold text-amber">{shareClicks}</p>
        </div>
      </div>

      {/* Share Code Section */}
      {shareLink && (
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Tracked Share URL
            </h3>
            <p className="font-mono text-sm text-white font-bold">/s/{shareLink.code}</p>
            <p className="text-[11px] text-zinc-500">
              Points to: <span className="text-zinc-400 break-all">{shareLink.targetUrl}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="border border-[#262626] bg-black/40 px-4 py-2 font-mono text-xs text-zinc-400">
              {shareClicks} clicks recorded
            </div>
          </div>
        </div>
      )}

      {/* Links and Code Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tracked External Links in Post */}
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-6 space-y-4">
          <h3 className="font-syne text-sm font-bold uppercase tracking-wider text-white">
            Tracked External Links
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#262626] text-zinc-500">
                  <th className="pb-2 font-bold uppercase tracking-wider">Short Link</th>
                  <th className="pb-2 font-bold uppercase tracking-wider">Target Destination</th>
                  <th className="pb-2 font-bold uppercase tracking-wider">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {post.shortLinks.filter((l) => l.type === "link").length > 0 ? (
                  post.shortLinks
                    .filter((l) => l.type === "link")
                    .map((link) => (
                      <tr key={link.id} className="text-zinc-300 hover:bg-white/[0.01]">
                        <td className="py-2.5 font-bold text-amber">/s/{link.code}</td>
                        <td className="py-2.5 max-w-[200px] truncate text-zinc-400" title={link.targetUrl}>
                          {link.targetUrl}
                        </td>
                        <td className="py-2.5 font-bold text-white">{link.clicks.length}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-zinc-650">
                      No external links inside this post.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Code Blocks in Post */}
        <div className="rounded-none border border-[#262626] bg-[#0c0c0c] p-6 space-y-4">
          <h3 className="font-syne text-sm font-bold uppercase tracking-wider text-white">
            Code Blocks Copy Metrics
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#262626] text-zinc-500">
                  <th className="pb-2 font-bold uppercase tracking-wider">Block ID</th>
                  <th className="pb-2 font-bold uppercase tracking-wider">Type</th>
                  <th className="pb-2 font-bold uppercase tracking-wider">Snippet</th>
                  <th className="pb-2 font-bold uppercase tracking-wider">Copies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {blockCopies.length > 0 ? (
                  blockCopies.map((block) => (
                    <tr key={block.codeBlockId} className="text-zinc-300 hover:bg-white/[0.01]">
                      <td className="py-2.5 font-bold text-amber">{block.codeBlockId}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            block.isMultiline
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          }`}
                        >
                          {block.isMultiline ? "multiline" : "inline"}
                        </span>
                      </td>
                      <td className="py-2.5 max-w-[180px] truncate">
                        <code className="text-zinc-400 bg-black/40 px-1 py-0.5 text-[10px]" title={block.codeBlock}>
                          {block.codeBlock.trim().slice(0, 30)}
                          {block.codeBlock.length > 30 && "..."}
                        </code>
                      </td>
                      <td className="py-2.5 font-bold text-white">{block.count}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-zinc-650">
                      No code blocks copied yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Combined Activity Log */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
        <h3 className="font-syne text-sm font-bold uppercase tracking-wider text-white">
          Recent Interactions Log (Last 50)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#262626] text-zinc-500">
                <th className="pb-3 font-bold uppercase tracking-wider">Time</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Action</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Type / Info</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Detail</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Platform</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Visitor Fingerprint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => {
                  let parsedBrowser = "—";
                  let parsedOS = "—";
                  if (log.userAgent) {
                    const parser = new UAParser(log.userAgent);
                    parsedBrowser = parser.getBrowser().name || "Unknown";
                    parsedOS = parser.getOS().name || "Unknown";
                  }

                  return (
                    <tr key={log.id} className="text-zinc-300 hover:bg-white/[0.01]">
                      <td className="py-3 text-zinc-500 text-[10px]">
                        {formatDate(log.createdAt)} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 font-bold">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            log.type === "copy"
                              ? "bg-amber/10 text-amber border border-amber/20"
                              : "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20"
                          }`}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-400 capitalize">{log.actionType}</td>
                      <td className="py-3 max-w-[200px] truncate text-zinc-350" title={log.detail}>
                        {log.detail}
                      </td>
                      <td className="py-3 text-zinc-450 text-[10px]">
                        {log.type === "click" ? `${parsedBrowser} (${parsedOS})` : "—"}
                      </td>
                      <td className="py-3 font-mono text-zinc-500 max-w-[120px] truncate" title={log.visitorId || "Unknown"}>
                        {log.visitorId ? log.visitorId.slice(0, 10) + "..." : "Anonymous"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-zinc-650">
                    No interactions logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
