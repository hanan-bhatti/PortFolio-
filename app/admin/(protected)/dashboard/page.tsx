/**
 * @file app/admin/(protected)/dashboard/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - DashboardPage (default): Main React component or function
 * - dynamic: Constant / Helper
 */

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import PageHeader from "@/components/admin/PageHeader";
import PublishToggle from "@/components/admin/PublishToggle";
import {
  FiUsers,
  FiEye,
  FiDownload,
  FiCamera,
  FiFileText,
  FiFolder,
  FiMail,
  FiActivity,
  FiPlus,
  FiUser,
  FiSettings,
} from "react-icons/fi";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    totalPosts,
    publishedPosts,
    totalProjects,
    unreadMessages,
    totalVisitors,
    totalPageViews,
    totalDownloads,
    totalPhotos,
    recentMessages,
    recentPosts,
    recentVisitors,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.project.count(),
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.visitor.count(),
    prisma.pageView.count(),
    prisma.resumeDownload.count(),
    prisma.photo.count(),
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.post.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.visitor.findMany({ orderBy: { lastSeen: "desc" }, take: 5 }),
  ]);

  // Page views in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const pageViewsLast30Days = await prisma.pageView.findMany({
    where: {
      timestamp: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      timestamp: true,
    },
  });

  // Top pages in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const topPages = await prisma.pageView.groupBy({
    by: ["path"],
    where: {
      timestamp: {
        gte: sevenDaysAgo,
      },
    },
    _count: {
      path: true,
    },
    orderBy: {
      _count: {
        path: "desc",
      },
    },
    take: 5,
  });

  // Group page views by date (YYYY-MM-DD)
  const viewsByDay: { [key: string]: number } = {};
  pageViewsLast30Days.forEach((pv) => {
    const dateStr = pv.timestamp.toISOString().split("T")[0] || "";
    viewsByDay[dateStr] = (viewsByDay[dateStr] || 0) + 1;
  });

  // Generate continuous list of last 30 days
  const sparklineData: number[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0] || "";
    sparklineData.push(viewsByDay[dateStr] || 0);
  }

  const maxVal = Math.max(...sparklineData, 1);
  const width = 240;
  const height = 40;
  const points = sparklineData
    .map((v, i) => {
      const x = (i / (sparklineData.length - 1)) * width;
      const y = height - (v / maxVal) * height;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  const stats = [
    { label: "Total Visitors", value: totalVisitors, icon: FiUsers, iconColor: "text-[#10B981]", subtext: "Unique sessions" },
    { label: "Total Page Views", value: totalPageViews, icon: FiEye, iconColor: "text-[#10B981]", subtext: "Total hits" },
    { label: "Resume Downloads", value: totalDownloads, icon: FiDownload, iconColor: "text-[#F59E0B]", subtext: "PDF downloads" },
    { label: "Photos Count", value: totalPhotos, icon: FiCamera, iconColor: "text-[#F59E0B]", subtext: "Photography assets" },
    { label: "Total Posts", value: totalPosts, icon: FiFileText, iconColor: "text-[#10B981]", subtext: `${publishedPosts} published` },
    { label: "Total Projects", value: totalProjects, icon: FiFolder, iconColor: "text-[#F59E0B]", subtext: "Portfolio items" },
    {
      label: "Unread Messages",
      value: unreadMessages,
      icon: FiMail,
      iconColor: unreadMessages > 0 ? "text-[#F59E0B] animate-pulse" : "text-zinc-500",
      subtext: unreadMessages > 0 ? "Action required" : "Inbox clean",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        crumbs={[{ label: "Admin" }, { label: "Dashboard" }]}
        action={
          <Link
            href="/"
            target="_blank"
            className="border border-zinc-700 bg-zinc-800/40 px-4 py-2 font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider transition-colors hover:bg-zinc-800"
          >
            Open Live Site ↗
          </Link>
        }
      />

      {/* Quick Actions Bar */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6">
        <h2 className="font-mono text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Link
            href="/admin/posts/new"
            className="flex items-center justify-center gap-2 border border-[#262626] bg-black/40 px-4 py-3 font-mono text-[11px] font-bold text-zinc-300 uppercase tracking-wider hover:border-[#10B981] hover:text-[#10B981] transition-all"
          >
            <FiPlus className="h-3.5 w-3.5" /> Post
          </Link>
          <Link
            href="/admin/projects/new"
            className="flex items-center justify-center gap-2 border border-[#262626] bg-black/40 px-4 py-3 font-mono text-[11px] font-bold text-zinc-300 uppercase tracking-wider hover:border-[#F59E0B] hover:text-[#F59E0B] transition-all"
          >
            <FiPlus className="h-3.5 w-3.5" /> Project
          </Link>
          <Link
            href="/admin/photography"
            className="flex items-center justify-center gap-2 border border-[#262626] bg-black/40 px-4 py-3 font-mono text-[11px] font-bold text-zinc-300 uppercase tracking-wider hover:border-[#10B981] hover:text-[#10B981] transition-all"
          >
            <FiCamera className="h-3.5 w-3.5" /> Photo
          </Link>
          <Link
            href="/admin/about"
            className="flex items-center justify-center gap-2 border border-[#262626] bg-black/40 px-4 py-3 font-mono text-[11px] font-bold text-zinc-300 uppercase tracking-wider hover:border-[#F59E0B] hover:text-[#F59E0B] transition-all"
          >
            <FiUser className="h-3.5 w-3.5" /> About
          </Link>
          <Link
            href="/admin/resume"
            className="flex items-center justify-center gap-2 border border-[#262626] bg-black/40 px-4 py-3 font-mono text-[11px] font-bold text-zinc-300 uppercase tracking-wider hover:border-[#10B981] hover:text-[#10B981] transition-all"
          >
            <FiFileText className="h-3.5 w-3.5" /> Resume
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center justify-center gap-2 border border-[#262626] bg-black/40 px-4 py-3 font-mono text-[11px] font-bold text-zinc-300 uppercase tracking-wider hover:border-[#F59E0B] hover:text-[#F59E0B] transition-all"
          >
            <FiSettings className="h-3.5 w-3.5" /> Settings
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-[#262626] bg-[#0c0c0c] p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
              <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold font-mono text-white tracking-tight">{stat.value}</p>
              {stat.subtext ? (
                <p className="mt-1 font-mono text-[9px] text-zinc-500 uppercase tracking-wide">{stat.subtext}</p>
              ) : null}
            </div>
          </div>
        ))}

        {/* 30-Day Activity Sparkline Card */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-widest">30-Day Activity</p>
            <FiActivity className="h-4 w-4 text-[#10B981]" />
          </div>
          <div className="mt-4 flex-1 flex flex-col justify-end">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10 overflow-visible">
              <defs>
                <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={areaPoints} fill="url(#sparkline-grad)" />
              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="1.5"
                points={points}
              />
            </svg>
            <div className="mt-1.5 flex justify-between text-[8px] font-mono text-zinc-600 uppercase tracking-wide">
              <span>30d ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panels Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Pages This Week */}
        <section className="border border-[#262626] bg-[#0c0c0c] p-6">
          <div className="mb-6 flex items-center justify-between border-b border-[#262626] pb-3">
            <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Top Pages (This Week)</h2>
            <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider">
              Views
            </span>
          </div>
          <div className="space-y-4">
            {topPages.map((page) => (
              <div key={page.path} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="truncate text-zinc-300" title={page.path}>
                    {page.path}
                  </span>
                  <span className="text-zinc-500">{page._count.path} views</span>
                </div>
                {/* Visual bar */}
                <div className="h-1 bg-zinc-900">
                  <div
                    className="h-full bg-[#10B981]"
                    style={{
                      width: `${(page._count.path / Math.max(...topPages.map((p) => p._count.path), 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {topPages.length === 0 ? (
              <p className="py-6 text-center font-mono text-xs text-zinc-600">No page views recorded this week</p>
            ) : null}
          </div>
        </section>

        {/* Recent Visitors */}
        <section className="border border-[#262626] bg-[#0c0c0c] p-6">
          <div className="mb-6 flex items-center justify-between border-b border-[#262626] pb-3">
            <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Recent Visitors</h2>
            <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider">
              Live Feed
            </span>
          </div>
          <ul className="divide-y divide-[#262626]">
            {recentVisitors.map((visitor) => (
              <li key={visitor.id} className="py-3 flex items-center justify-between text-xs font-mono">
                <div className="flex flex-col">
                  <span className="text-zinc-200 font-medium">
                    {visitor.country || "Unknown Location"}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide mt-0.5">
                    {visitor.device || "desktop"} • {visitor.browser || "unknown"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400">
                    {formatDate(visitor.lastSeen)}
                  </span>
                  <span className="block text-[10px] text-zinc-600 mt-0.5">
                    {visitor.visits} visits
                  </span>
                </div>
              </li>
            ))}
            {recentVisitors.length === 0 ? (
              <li className="py-6 text-center text-xs font-mono text-zinc-600">No visitors recorded yet</li>
            ) : null}
          </ul>
        </section>

        {/* Recent Messages */}
        <section className="border border-[#262626] bg-[#0c0c0c] p-6">
          <div className="mb-6 flex items-center justify-between border-b border-[#262626] pb-3">
            <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Recent Messages</h2>
            <Link href="/admin/messages" className="font-mono text-[10px] text-[#F59E0B] uppercase tracking-wider hover:underline">
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-[#262626]">
            {recentMessages.map((msg) => (
              <li key={msg.id} className="py-3">
                <div className="flex items-center justify-between font-mono text-xs">
                  <p className="font-medium text-zinc-200 flex items-center gap-2">
                    {!msg.read ? (
                      <span className="inline-block h-1.5 w-1.5 bg-[#10B981]" />
                    ) : null}
                    {msg.name}
                  </p>
                  <span className="text-[10px] text-zinc-500">{formatDate(msg.createdAt)}</span>
                </div>
                <p className="mt-1 truncate font-mono text-[11px] text-zinc-400">{msg.subject}</p>
              </li>
            ))}
            {recentMessages.length === 0 ? (
              <li className="py-6 text-center font-mono text-xs text-zinc-600">No messages yet</li>
            ) : null}
          </ul>
        </section>

        {/* Recent Posts */}
        <section className="border border-[#262626] bg-[#0c0c0c] p-6">
          <div className="mb-6 flex items-center justify-between border-b border-[#262626] pb-3">
            <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest">Recent Posts</h2>
            <Link href="/admin/posts" className="font-mono text-[10px] text-[#F59E0B] uppercase tracking-wider hover:underline">
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-[#262626]">
            {recentPosts.map((post) => (
              <li key={post.id} className="flex items-center justify-between gap-3 py-3">
                <Link href={`/admin/posts/${post.id}/edit`} className="min-w-0 flex-1 group">
                  <p className="truncate font-mono text-xs text-zinc-200 group-hover:text-[#F59E0B] transition-colors">{post.title}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-zinc-500">{formatDate(post.createdAt)}</p>
                </Link>
                <PublishToggle id={post.id} published={post.published} />
              </li>
            ))}
            {recentPosts.length === 0 ? (
              <li className="py-6 text-center font-mono text-xs text-zinc-600">No posts yet</li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
