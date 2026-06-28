"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  LuArrowLeft, 
  LuGlobe, 
  LuExternalLink, 
  LuSearch, 
  LuLink, 
  LuMonitor, 
  LuSmartphone, 
  LuLaptop 
} from "react-icons/lu";
import AnalyticsChart from "@/components/admin/AnalyticsChart";

interface ShortLinkMeta {
  id: string;
  code: string;
  targetUrl: string;
  type: string;
  targetDisplay: string;
  clicksCount: number;
}

interface ClickLog {
  id: string;
  visitorId: string | null;
  location: string;
  device: string;
  browser: string;
  os: string;
  referer: string;
  timestamp: string; // ISO String
}

interface ChartDataset {
  label: string;
  clicks: number;
}

interface DistributionItem {
  label: string;
  count: number;
}

interface ShortLinkDetailClientProps {
  shortLink: ShortLinkMeta;
  clicks: ClickLog[];
  timelineData: ChartDataset[];
  devices: DistributionItem[];
  browsers: DistributionItem[];
  oss: DistributionItem[];
}

export default function ShortLinkDetailClient({
  shortLink,
  clicks,
  timelineData,
  devices,
  browsers,
  oss,
}: ShortLinkDetailClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Formatting helper
  const formatFullDate = (dateVal: string) => {
    const d = new Date(dateVal);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Device icon selector
  const getDeviceIcon = (device: string) => {
    const lower = device.toLowerCase();
    if (lower.includes("mobile") || lower.includes("phone")) return <LuSmartphone className="w-3.5 h-3.5 text-zinc-500" />;
    if (lower.includes("tablet") || lower.includes("ipad")) return <LuLaptop className="w-3.5 h-3.5 text-zinc-500" />;
    return <LuMonitor className="w-3.5 h-3.5 text-zinc-500" />;
  };

  // Chart options & configurations
  const timelineChartData = {
    labels: timelineData.map((d) => d.label),
    datasets: [
      {
        label: "Clicks",
        data: timelineData.map((d) => d.clicks),
        backgroundColor: "#16A34A",
        borderColor: "#16A34A",
        borderWidth: 1,
      },
    ],
  };

  const timelineChartOptions = {
    scales: {
      y: { ticks: { precision: 0 } },
    },
  };

  const generatePieData = (items: DistributionItem[], label: string) => ({
    labels: items.map((i) => i.label),
    datasets: [
      {
        label,
        data: items.map((i) => i.count),
        backgroundColor: ["#16A34A", "#F59E0B", "#71717a", "#a1a1aa", "#3f3f46"],
        borderColor: ["#0c0c0c", "#0c0c0c", "#0c0c0c", "#0c0c0c", "#0c0c0c"],
        borderWidth: 2,
      },
    ],
  });

  // Table filtering & sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const filteredClicks = clicks.filter((click) => {
    const term = searchQuery.toLowerCase();
    return (
      (click.visitorId && click.visitorId.toLowerCase().includes(term)) ||
      click.location.toLowerCase().includes(term) ||
      click.device.toLowerCase().includes(term) ||
      click.browser.toLowerCase().includes(term) ||
      click.referer.toLowerCase().includes(term)
    );
  });

  const sortedClicks = [...filteredClicks].sort((a, b) => {
    let valA = (a as any)[sortField];
    let valB = (b as any)[sortField];

    if (sortField === "timestamp") {
      const timeA = new Date(valA).getTime();
      const timeB = new Date(valB).getTime();
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    }

    valA = valA || "";
    valB = valB || "";
    return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  const totalPages = Math.ceil(sortedClicks.length / rowsPerPage);
  const paginatedClicks = sortedClicks.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Back button & title */}
      <div>
        <Link
          href="/admin/analytics/clicks"
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-zinc-500 hover:text-white transition-colors"
        >
          <LuArrowLeft className="w-3.5 h-3.5" /> BACK TO INTERACTIONS
        </Link>
        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-syne text-2xl font-bold text-white uppercase tracking-tight">
              {shortLink.targetDisplay}
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span>Code suffix: <strong className="text-white">/s/{shortLink.code}</strong></span>
              <span className="text-zinc-700">|</span>
              <span className="flex items-center gap-1">
                Redirects to: 
                <a 
                  href={shortLink.targetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-amber hover:underline inline-flex items-center gap-0.5"
                >
                  {shortLink.targetUrl} <LuExternalLink className="w-3 h-3" />
                </a>
              </span>
            </p>
          </div>
          <div className="border border-[#262626] bg-[#0c0c0c] px-6 py-3 font-mono text-center">
            <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-widest">Total Clicks</span>
            <span className="text-2xl font-bold text-amber block mt-0.5">{shortLink.clicksCount}</span>
          </div>
        </div>
      </div>

      {/* Analytics charts */}
      {clicks.length > 0 ? (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
              <h3 className="font-syne text-xs font-bold uppercase tracking-wider text-white">
                Clicks Timeline (Last 7 Days)
              </h3>
              <AnalyticsChart type="bar" data={timelineChartData} options={timelineChartOptions} height={200} />
            </div>

            <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
              <h3 className="font-syne text-xs font-bold uppercase tracking-wider text-white">
                Device Distribution
              </h3>
              <div className="flex items-center justify-center h-[200px]">
                <AnalyticsChart type="doughnut" data={generatePieData(devices, "Devices")} height={180} />
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
              <h3 className="font-syne text-xs font-bold uppercase tracking-wider text-white">
                Browser Distribution
              </h3>
              <div className="flex items-center justify-center h-[200px]">
                <AnalyticsChart type="doughnut" data={generatePieData(browsers, "Browsers")} height={180} />
              </div>
            </div>

            <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
              <h3 className="font-syne text-xs font-bold uppercase tracking-wider text-white">
                Operating System Distribution
              </h3>
              <div className="flex items-center justify-center h-[200px]">
                <AnalyticsChart type="doughnut" data={generatePieData(oss, "OS")} height={180} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="border border-[#262626] bg-[#0c0c0c] p-12 text-center rounded-none font-mono text-zinc-500 uppercase tracking-widest text-xs">
          No click tracking data available yet for this link
        </div>
      )}

      {/* Click logs table */}
      {clicks.length > 0 && (
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h2 className="font-syne text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <LuLink className="w-4 h-4 text-emerald-400" /> Redirect Click Logs
                </h2>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">Timeline logs of all visitors reaching via this redirection path</p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full sm:w-60 bg-[#121212] border border-[#262626] pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
                />
                <LuSearch className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-600" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#262626] text-zinc-500">
                    <th 
                      className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                      onClick={() => handleSort("visitorId")}
                    >
                      Visitor ID {sortField === "visitorId" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th 
                      className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                      onClick={() => handleSort("location")}
                    >
                      Location {sortField === "location" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th 
                      className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                      onClick={() => handleSort("device")}
                    >
                      Device {sortField === "device" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th 
                      className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                      onClick={() => handleSort("browser")}
                    >
                      Agent / Browser {sortField === "browser" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th 
                      className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                      onClick={() => handleSort("referer")}
                    >
                      Referrer {sortField === "referer" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th 
                      className="pb-3 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                      onClick={() => handleSort("timestamp")}
                    >
                      Timestamp {sortField === "timestamp" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e1e]">
                  {paginatedClicks.map((click) => (
                    <tr key={click.id} className="text-zinc-300 hover:bg-white/[0.01]">
                      <td className="py-3.5 max-w-[120px] truncate font-bold text-zinc-400">
                        {click.visitorId ? (
                          <Link 
                            href={`/admin/analytics/visitors/${click.visitorId}`}
                            className="hover:text-amber hover:underline text-[11px]"
                          >
                            {click.visitorId.slice(0, 12)}...
                          </Link>
                        ) : (
                          "anonymous"
                        )}
                      </td>
                      <td className="py-3.5 text-zinc-400 font-semibold">{click.location}</td>
                      <td className="py-3.5 text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          {getDeviceIcon(click.device)}
                          {click.device}
                        </span>
                      </td>
                      <td className="py-3.5 text-zinc-500 font-semibold">
                        {click.browser} ({click.os})
                      </td>
                      <td className="py-3.5 text-zinc-500 max-w-[200px] truncate" title={click.referer}>
                        {click.referer || "direct"}
                      </td>
                      <td className="py-3.5 text-zinc-500">{formatFullDate(click.timestamp)}</td>
                    </tr>
                  ))}
                  {filteredClicks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-600">No logs match search query</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#262626] pt-4 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="bg-[#121212] border border-[#262626] px-3 py-1 text-[11px] font-mono hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-zinc-300"
              >
                PREV
              </button>
              <span className="text-[11px] font-mono text-zinc-500">
                PAGE {page} OF {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="bg-[#121212] border border-[#262626] px-3 py-1 text-[11px] font-mono hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-zinc-300"
              >
                NEXT
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
