/**
 * @file app/admin/(protected)/analytics/clicks/page.tsx
 * @description Admin page for post-wise grouped interaction metrics, link clicks, shares, and code copy statistics.
 * 
 * @exports
 * - AnalyticsInteractionsPage (default): Main React component
 * - dynamic: Constant / Helper
 */

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsInteractionsPage() {
  const [posts, totalCopies, totalLinkClicks, totalShareClicks] = await Promise.all([
    prisma.post.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        shortLinks: {
          select: {
            id: true,
            type: true,
            clicks: { select: { createdAt: true } },
          },
        },
        codeCopyEvents: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.codeCopyEvent.count(),
    prisma.shortLinkClick.count({ where: { shortLink: { type: "link" } } }),
    prisma.shortLinkClick.count({ where: { shortLink: { type: "share" } } }),
  ]);

  // Aggregate stats per post
  const postsWithStats = posts.map((post) => {
    const linkClicks = post.shortLinks
      .filter((l) => l.type === "link")
      .reduce((sum, l) => sum + l.clicks.length, 0);

    const shareClicks = post.shortLinks
      .filter((l) => l.type === "share")
      .reduce((sum, l) => sum + l.clicks.length, 0);

    const codeCopies = post.codeCopyEvents.length;
    const totalInteractions = linkClicks + shareClicks + codeCopies;

    // Find last activity date
    const clickTimes = post.shortLinks.flatMap((l) => l.clicks.map((c) => c.createdAt.getTime()));
    const copyTimes = post.codeCopyEvents.map((e) => e.createdAt.getTime());
    const allTimes = [...clickTimes, ...copyTimes];
    const lastActivity = allTimes.length > 0 ? new Date(Math.max(...allTimes)) : null;

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      linkClicks,
      shareClicks,
      codeCopies,
      totalInteractions,
      lastActivity,
    };
  });

  // Global short links not associated with a specific post (if any exist)
  const orphanShortLinks = await prisma.shortLink.findMany({
    where: { postId: null },
    include: { clicks: true },
  });

  const orphanClicks = orphanShortLinks.reduce((sum, l) => sum + l.clicks.length, 0);

  // Sorting for top performing posts chart (max 5)
  const topPosts = [...postsWithStats]
    .filter((p) => p.totalInteractions > 0)
    .sort((a, b) => b.totalInteractions - a.totalInteractions)
    .slice(0, 5);

  const peakInteractions = topPosts.length > 0 ? Math.max(...topPosts.map((p) => p.totalInteractions)) : 0;

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

      {/* CSS Chart: Top Posts by Interactions */}
      {topPosts.length > 0 && (
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
          <h3 className="font-syne text-sm font-bold uppercase tracking-wider text-white">
            Top Posts by Interactions (Clicks & Copies)
          </h3>
          <div className="space-y-4 pt-2">
            {topPosts.map((post) => {
              const percent = peakInteractions > 0 ? Math.round((post.totalInteractions / peakInteractions) * 100) : 0;
              return (
                <div key={post.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <Link
                      href={`/admin/analytics/clicks/${post.id}`}
                      className="text-zinc-300 hover:text-amber hover:underline truncate max-w-[70%]"
                    >
                      {post.title}
                    </Link>
                    <span className="text-zinc-500 font-bold shrink-0 ml-2">
                      {post.totalInteractions} interactions
                    </span>
                  </div>
                  <div className="w-full bg-[#181818] h-3 rounded-none overflow-hidden border border-[#262626]/40">
                    <div
                      className="bg-amber h-full rounded-none transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Post-wise Grouped Table */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400">
          Post Interactions Summary
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#262626] text-zinc-500">
                <th className="pb-3 font-bold uppercase tracking-wider">Post Title</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Link Clicks</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Share Clicks</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Code Copies</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Total</th>
                <th className="pb-3 font-bold uppercase tracking-wider">Last Activity</th>
                <th className="pb-3 text-right font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {postsWithStats.map((post) => (
                <tr key={post.id} className="text-zinc-300 hover:bg-white/[0.01]">
                  <td className="py-3.5 max-w-[280px] truncate font-bold text-white">
                    <Link href={`/admin/analytics/clicks/${post.id}`} className="hover:text-amber hover:underline">
                      {post.title}
                    </Link>
                  </td>
                  <td className="py-3.5 text-zinc-400">{post.linkClicks}</td>
                  <td className="py-3.5 text-zinc-400">{post.shareClicks}</td>
                  <td className="py-3.5 text-zinc-400">{post.codeCopies}</td>
                  <td className="py-3.5 font-bold text-amber">{post.totalInteractions}</td>
                  <td className="py-3.5 text-zinc-500">
                    {post.lastActivity ? formatDate(post.lastActivity) : "—"}
                  </td>
                  <td className="py-3.5 text-right">
                    <Link
                      href={`/admin/analytics/clicks/${post.id}`}
                      className="border border-[#262626] bg-black/40 px-2.5 py-1 text-[10px] font-bold text-zinc-400 hover:border-amber hover:text-amber transition-colors rounded-none cursor-pointer"
                    >
                      VIEW DETAILS →
                    </Link>
                  </td>
                </tr>
              ))}
              {orphanClicks > 0 && (
                <tr className="text-zinc-300 hover:bg-white/[0.01] bg-black/10">
                  <td className="py-3.5 font-bold text-zinc-450 italic">Global / Short links (Not tied to post)</td>
                  <td className="py-3.5 text-zinc-400">{orphanClicks}</td>
                  <td className="py-3.5 text-zinc-400">0</td>
                  <td className="py-3.5 text-zinc-400">0</td>
                  <td className="py-3.5 font-bold text-amber">{orphanClicks}</td>
                  <td className="py-3.5 text-zinc-500">—</td>
                  <td className="py-3.5 text-right">—</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
