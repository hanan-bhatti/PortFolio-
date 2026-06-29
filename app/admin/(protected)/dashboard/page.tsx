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
import PageHeader from "@/components/admin/PageHeader";
import DashboardClient from "@/components/admin/DashboardClient";
import {
  FiUsers,
  FiEye,
  FiDownload,
  FiCamera,
  FiFileText,
  FiFolder,
  FiMail,
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
  const datesList: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0] || "";
    sparklineData.push(viewsByDay[dateStr] || 0);
    datesList.push(dateStr);
  }

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
        inlineAction={true}
        action={
          <Link
            href="/"
            target="_blank"
            className="border border-[#262626] bg-black/40 px-2.5 py-1 font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:border-[#10B981] hover:text-[#10B981] transition-all rounded-none"
          >
            Live Site ↗
          </Link>
        }
      />

      {/* Quick Actions Bar */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-4 sm:p-6">
        <h2 className="font-mono text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="flex flex-row overflow-x-auto gap-2 pb-2 min-w-0 md:grid md:grid-cols-6 md:gap-3 md:pb-0 scrollbar-none">
          <Link
            href="/admin/posts/new"
            className="flex items-center justify-center gap-1.5 border border-[#262626] bg-black/40 px-3 py-2 font-mono text-[10px] font-bold text-zinc-300 uppercase tracking-wider hover:border-[#10B981] hover:text-[#10B981] transition-all whitespace-nowrap shrink-0 rounded-none min-w-[90px] md:min-w-0"
          >
            <FiPlus className="h-3 w-3 shrink-0" /> Post
          </Link>
          <Link
            href="/admin/projects/new"
            className="flex items-center justify-center gap-1.5 border border-[#262626] bg-black/40 px-3 py-2 font-mono text-[10px] font-bold text-zinc-300 uppercase tracking-wider hover:border-[#F59E0B] hover:text-[#F59E0B] transition-all whitespace-nowrap shrink-0 rounded-none min-w-[90px] md:min-w-0"
          >
            <FiPlus className="h-3 w-3 shrink-0" /> Project
          </Link>
          <Link
            href="/admin/photography"
            className="flex items-center justify-center gap-1.5 border border-[#262626] bg-black/40 px-3 py-2 font-mono text-[10px] font-bold text-zinc-300 uppercase tracking-wider hover:border-[#10B981] hover:text-[#10B981] transition-all whitespace-nowrap shrink-0 rounded-none min-w-[90px] md:min-w-0"
          >
            <FiCamera className="h-3 w-3 shrink-0" /> Photo
          </Link>
          <Link
            href="/admin/about"
            className="flex items-center justify-center gap-1.5 border border-[#262626] bg-black/40 px-3 py-2 font-mono text-[10px] font-bold text-zinc-300 uppercase tracking-wider hover:border-[#F59E0B] hover:text-[#F59E0B] transition-all whitespace-nowrap shrink-0 rounded-none min-w-[90px] md:min-w-0"
          >
            <FiUser className="h-3 w-3 shrink-0" /> About
          </Link>
          <Link
            href="/admin/resume"
            className="flex items-center justify-center gap-1.5 border border-[#262626] bg-black/40 px-3 py-2 font-mono text-[10px] font-bold text-zinc-300 uppercase tracking-wider hover:border-[#10B981] hover:text-[#10B981] transition-all whitespace-nowrap shrink-0 rounded-none min-w-[90px] md:min-w-0"
          >
            <FiFileText className="h-3 w-3 shrink-0" /> Resume
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center justify-center gap-1.5 border border-[#262626] bg-black/40 px-3 py-2 font-mono text-[10px] font-bold text-zinc-300 uppercase tracking-wider hover:border-[#F59E0B] hover:text-[#F59E0B] transition-all whitespace-nowrap shrink-0 rounded-none min-w-[90px] md:min-w-0"
          >
            <FiSettings className="h-3 w-3 shrink-0" /> Settings
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-[#262626] bg-[#0c0c0c] p-4 flex flex-col justify-between h-[115px] rounded-none">
            <div className="flex items-start justify-between gap-2">
              <p className="font-mono text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-snug">{stat.label}</p>
              <stat.icon className={cn("h-4 w-4 shrink-0 mt-0.5", stat.iconColor)} />
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight leading-none">{stat.value}</p>
              {stat.subtext ? (
                <p className="mt-1 font-mono text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-wide leading-none">{stat.subtext}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Planner, Calendar and Analytics Components */}
      <DashboardClient
        stats={{
          totalVisitors,
          totalPageViews,
          totalDownloads,
          totalPhotos,
          totalPosts,
          publishedPosts,
          totalProjects,
          unreadMessages,
        }}
        recentMessages={recentMessages}
        recentVisitors={recentVisitors}
        topPages={topPages}
        sparklineData={sparklineData}
        datesList={datesList}
      />
    </div>
  );
}
