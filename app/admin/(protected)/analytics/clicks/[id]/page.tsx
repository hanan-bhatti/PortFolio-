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
import AnalyticsChart from "@/components/admin/AnalyticsChart";

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
            include: {
              visitor: true,
            },
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

  // Generate 7 days of activity timeline
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  }).reverse();

  const chartData = last7Days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const clicksCount = post.shortLinks.reduce((sum, link) => {
      return (
        sum +
        link.clicks.filter((click) => {
          const time = click.createdAt.getTime();
          return time >= day.getTime() && time < nextDay.getTime();
        }).length
      );
    }, 0);

    const copiesCount = post.codeCopyEvents.filter((event) => {
      const time = event.createdAt.getTime();
      return time >= day.getTime() && time < nextDay.getTime();
    }).length;

    return {
      label: day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      clicks: clicksCount,
      copies: copiesCount,
      total: clicksCount + copiesCount,
    };
  });

  // Timeline Chart datasets
  const timelineChartData = {
    labels: chartData.map((d) => d.label.split(",")[0]),
    datasets: [
      {
        label: "Clicks",
        data: chartData.map((d) => d.clicks),
        backgroundColor: "#16A34A",
        borderColor: "#16A34A",
        borderWidth: 1,
      },
      {
        label: "Copies",
        data: chartData.map((d) => d.copies),
        backgroundColor: "#F59E0B",
        borderColor: "#F59E0B",
        borderWidth: 1,
      },
    ],
  };

  const timelineChartOptions = {
    scales: {
      x: { stacked: true },
      y: { stacked: true, ticks: { precision: 0 } },
    },
  };

  // Interactions Share Doughnut Chart
  const breakdownChartData = {
    labels: ["External Clicks", "Share Clicks", "Copies"],
    datasets: [
      {
        data: [linkClicks, shareClicks, codeCopies],
        backgroundColor: ["#16A34A", "#F59E0B", "#71717a"],
        borderColor: ["#0c0c0c", "#0c0c0c", "#0c0c0c"],
        borderWidth: 2,
      },
    ],
  };

  // Platform and Agent aggregation
  const deviceCounts: Record<string, number> = {};
  const osCounts: Record<string, number> = {};
  const browserCounts: Record<string, number> = {};

  const addDevice = (device: string | null) => {
    const name = device || "desktop";
    deviceCounts[name] = (deviceCounts[name] || 0) + 1;
  };

  const addOS = (os: string | null) => {
    const name = os || "Unknown";
    osCounts[name] = (osCounts[name] || 0) + 1;
  };

  const addBrowser = (browser: string | null) => {
    const name = browser || "Unknown";
    browserCounts[name] = (browserCounts[name] || 0) + 1;
  };

  post.shortLinks.forEach((link) => {
    link.clicks.forEach((click) => {
      if (click.visitor) {
        addDevice(click.visitor.device);
        addOS(click.visitor.os);
        addBrowser(click.visitor.browser);
      } else if (click.userAgent) {
        const parser = new UAParser(click.userAgent);
        addDevice(parser.getDevice().type || "desktop");
        addOS(parser.getOS().name || "Unknown");
        addBrowser(parser.getBrowser().name || "Unknown");
      } else {
        addDevice("desktop");
        addOS("Unknown");
        addBrowser("Unknown");
      }
    });
  });

  post.codeCopyEvents.forEach((event) => {
    if (event.visitor) {
      addDevice(event.visitor.device);
      addOS(event.visitor.os);
      addBrowser(event.visitor.browser);
    } else {
      addDevice("desktop");
      addOS("Unknown");
      addBrowser("Unknown");
    }
  });

  const deviceChartData = {
    labels: Object.keys(deviceCounts).map((k) => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [
      {
        data: Object.values(deviceCounts),
        backgroundColor: ["#16A34A", "#F59E0B", "#71717a", "#a1a1aa"],
        borderColor: ["#0c0c0c", "#0c0c0c", "#0c0c0c", "#0c0c0c"],
        borderWidth: 2,
      },
    ],
  };

  const sortedOS = Object.entries(osCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const osChartData = {
    labels: sortedOS.map((x) => x[0]),
    datasets: [
      {
        label: "Interactions",
        data: sortedOS.map((x) => x[1]),
        backgroundColor: "#16A34A",
        borderColor: "#16A34A",
        borderWidth: 1,
      },
    ],
  };

  const osChartOptions = {
    indexAxis: "y" as const,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { precision: 0 } } },
  };

  const sortedBrowser = Object.entries(browserCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const browserChartData = {
    labels: sortedBrowser.map((x) => x[0]),
    datasets: [
      {
        label: "Interactions",
        data: sortedBrowser.map((x) => x[1]),
        backgroundColor: "#F59E0B",
        borderColor: "#F59E0B",
        borderWidth: 1,
      },
    ],
  };

  const browserChartOptions = {
    indexAxis: "y" as const,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { precision: 0 } } },
  };

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

  const topBlocks = blockCopies.slice(0, 5);
  const blocksChartData = {
    labels: topBlocks.map((b) => b.codeBlockId),
    datasets: [
      {
        label: "Copies",
        data: topBlocks.map((b) => b.count),
        backgroundColor: "#F59E0B",
        borderColor: "#F59E0B",
        borderWidth: 1,
      },
    ],
  };

  const blocksChartOptions = {
    indexAxis: "y" as const,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { precision: 0 } } },
  };

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

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Timeline Chart */}
        <div className="lg:col-span-2 border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
          <h3 className="font-syne text-xs font-bold uppercase tracking-wider text-white">
            Activity Timeline (Last 7 Days)
          </h3>
          <AnalyticsChart type="bar" data={timelineChartData} options={timelineChartOptions} height={200} />
        </div>

        {/* Share Distribution */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
          <h3 className="font-syne text-xs font-bold uppercase tracking-wider text-white">
            Interactions Share
          </h3>
          <div className="flex items-center justify-center h-[200px]">
            <AnalyticsChart type="doughnut" data={breakdownChartData} height={180} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Code Blocks Copies */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
          <h3 className="font-syne text-xs font-bold uppercase tracking-wider text-white">
            Top Copied Code Blocks
          </h3>
          {topBlocks.length > 0 ? (
            <AnalyticsChart type="bar" data={blocksChartData} options={blocksChartOptions} height={200} />
          ) : (
            <div className="flex h-[200px] items-center justify-center font-mono text-xs text-zinc-500">
              No code blocks copied yet.
            </div>
          )}
        </div>

        {/* Device Distribution */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
          <h3 className="font-syne text-xs font-bold uppercase tracking-wider text-white">
            Device Distribution
          </h3>
          {Object.keys(deviceCounts).length > 0 ? (
            <div className="flex items-center justify-center h-[200px]">
              <AnalyticsChart type="doughnut" data={deviceChartData} height={180} />
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center font-mono text-xs text-zinc-500">
              No platform data recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Browser Breakdown */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
          <h3 className="font-syne text-xs font-bold uppercase tracking-wider text-white">
            Top Browsers
          </h3>
          {sortedBrowser.length > 0 ? (
            <AnalyticsChart type="bar" data={browserChartData} options={browserChartOptions} height={180} />
          ) : (
            <div className="flex h-[180px] items-center justify-center font-mono text-xs text-zinc-500">
              No browser data recorded yet.
            </div>
          )}
        </div>

        {/* OS Breakdown */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
          <h3 className="font-syne text-xs font-bold uppercase tracking-wider text-white">
            Top Operating Systems
          </h3>
          {sortedOS.length > 0 ? (
            <AnalyticsChart type="bar" data={osChartData} options={osChartOptions} height={180} />
          ) : (
            <div className="flex h-[180px] items-center justify-center font-mono text-xs text-zinc-500">
              No OS data recorded yet.
            </div>
          )}
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
                              ? "border border-zinc-700 bg-zinc-800/10 text-zinc-400"
                              : "border border-amber/20 bg-amber/10 text-amber"
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
