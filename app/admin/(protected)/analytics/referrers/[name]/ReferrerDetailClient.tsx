"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  LuLaptop, 
  LuSmartphone, 
  LuTablet, 
  LuGlobe, 
  LuClock, 
  LuEye,
  LuExternalLink 
} from "react-icons/lu";

interface Visitor {
  id: string;
  city: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  pageViewsCount: number;
}

interface PageViewLog {
  id: string;
  path: string;
  referrer: string | null;
  timestamp: Date | string;
}

interface ReferrerDetailClientProps {
  initialVisitors: Visitor[];
  initialPageViews: PageViewLog[];
}

export default function ReferrerDetailClient({
  initialVisitors,
  initialPageViews,
}: ReferrerDetailClientProps) {
  // Visitors Table States
  const [visitorSearch, setVisitorSearch] = useState("");
  const [visitorSortField, setVisitorSortField] = useState<string>("pageViewsCount");
  const [visitorSortOrder, setVisitorSortOrder] = useState<"asc" | "desc">("desc");
  const [visitorPage, setVisitorPage] = useState(1);
  const visitorsPerPage = 10;

  // Referral Logs Table States
  const [logSearch, setLogSearch] = useState("");
  const [logSortField, setLogSortField] = useState<string>("timestamp");
  const [logSortOrder, setLogSortOrder] = useState<"asc" | "desc">("desc");
  const [logPage, setLogPage] = useState(1);
  const logsPerPage = 10;

  // Format Helper
  const formatDateTime = (dateVal: Date | string) => {
    const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeviceIcon = (device: string | null) => {
    switch (device?.toLowerCase()) {
      case "mobile":
        return <LuSmartphone className="w-3.5 h-3.5 text-emerald-400" />;
      case "tablet":
        return <LuTablet className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <LuLaptop className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  // ── FILTER & SORT: VISITORS ──
  const handleVisitorSort = (field: string) => {
    if (visitorSortField === field) {
      setVisitorSortOrder(visitorSortOrder === "asc" ? "desc" : "asc");
    } else {
      setVisitorSortField(field);
      setVisitorSortOrder("desc");
    }
    setVisitorPage(1);
  };

  const filteredVisitors = initialVisitors.filter((v) => {
    const term = visitorSearch.toLowerCase();
    const id = v.id.toLowerCase();
    const country = (v.country || "").toLowerCase();
    const city = (v.city || "").toLowerCase();
    const device = (v.device || "").toLowerCase();
    const browser = (v.browser || "").toLowerCase();
    return (
      id.includes(term) ||
      country.includes(term) ||
      city.includes(term) ||
      device.includes(term) ||
      browser.includes(term)
    );
  });

  const sortedVisitors = [...filteredVisitors].sort((a, b) => {
    let valA = (a as any)[visitorSortField];
    let valB = (b as any)[visitorSortField];

    if (visitorSortField === "id" || visitorSortField === "country" || visitorSortField === "browser") {
      valA = valA || "";
      valB = valB || "";
      return visitorSortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    return visitorSortOrder === "asc" ? valA - valB : valB - valA;
  });

  const totalVisitorPages = Math.ceil(sortedVisitors.length / visitorsPerPage);
  const paginatedVisitors = sortedVisitors.slice(
    (visitorPage - 1) * visitorsPerPage,
    visitorPage * visitorsPerPage
  );

  // ── FILTER & SORT: LOGS ──
  const handleLogSort = (field: string) => {
    if (logSortField === field) {
      setLogSortOrder(logSortOrder === "asc" ? "desc" : "asc");
    } else {
      setLogSortField(field);
      setLogSortOrder("desc");
    }
    setLogPage(1);
  };

  const filteredLogs = initialPageViews.filter((log) => {
    const term = logSearch.toLowerCase();
    const path = log.path.toLowerCase();
    const referrer = (log.referrer || "").toLowerCase();
    return path.includes(term) || referrer.includes(term);
  });

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let valA = (a as any)[logSortField];
    let valB = (b as any)[logSortField];

    if (logSortField === "timestamp") {
      const timeA = new Date(valA).getTime();
      const timeB = new Date(valB).getTime();
      return logSortOrder === "asc" ? timeA - timeB : timeB - timeA;
    }

    valA = valA || "";
    valB = valB || "";
    return logSortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  const totalLogPages = Math.ceil(sortedLogs.length / logsPerPage);
  const paginatedLogs = sortedLogs.slice(
    (logPage - 1) * logsPerPage,
    logPage * logsPerPage
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* LEFT COLUMN: Top pages breakdown */}
      <div className="lg:col-span-1 space-y-6">
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none">
          <h3 className="mb-4 font-syne text-md font-bold text-white tracking-tight flex items-center gap-2">
            <LuEye className="w-5 h-5 text-sky-400" /> Top Target Pages
          </h3>
          <div className="space-y-3">
            {/* Top pages are calculated simply by grouping logs */}
            {Array.from(
              initialPageViews.reduce((acc, log) => {
                acc.set(log.path, (acc.get(log.path) || 0) + 1);
                return acc;
              }, new Map<string, number>()).entries()
            )
              .map(([path, count]) => ({ path, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 10)
              .map((page) => (
                <div key={page.path} className="flex flex-col gap-1 py-2 border-b border-[#262626]/30 last:border-0">
                  <span className="text-zinc-300 text-xs font-semibold font-mono truncate max-w-full" title={page.path}>
                    {page.path}
                  </span>
                  <div className="flex justify-between items-center text-[11px] text-zinc-500 font-mono">
                    <span>Views attributed</span>
                    <span className="text-white font-semibold">{page.count} views</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Attributed Visitors & Log Timeline */}
      <div className="lg:col-span-2 space-y-6">
        {/* Attributed Visitors Table */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="font-syne text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <LuGlobe className="w-5 h-5 text-emerald-400" /> Attributed Visitors
              </h2>
              <input
                type="text"
                placeholder="Search visitors..."
                value={visitorSearch}
                onChange={(e) => {
                  setVisitorSearch(e.target.value);
                  setVisitorPage(1);
                }}
                className="w-full sm:w-48 bg-[#121212] border border-[#262626] px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
              />
            </div>
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-[#262626] text-zinc-500 font-mono text-[10px] uppercase">
                    <th 
                      className="pb-3 font-medium cursor-pointer hover:text-white transition select-none"
                      onClick={() => handleVisitorSort("id")}
                    >
                      Visitor Profile ID {visitorSortField === "id" && (visitorSortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th 
                      className="pb-3 font-medium cursor-pointer hover:text-white transition select-none"
                      onClick={() => handleVisitorSort("country")}
                    >
                      Geo / Location {visitorSortField === "country" && (visitorSortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th 
                      className="pb-3 font-medium cursor-pointer hover:text-white transition select-none"
                      onClick={() => handleVisitorSort("browser")}
                    >
                      Device Configuration {visitorSortField === "browser" && (visitorSortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th 
                      className="pb-3 text-right font-medium pr-2 cursor-pointer hover:text-white transition select-none"
                      onClick={() => handleVisitorSort("pageViewsCount")}
                    >
                      Referral Views {visitorSortField === "pageViewsCount" && (visitorSortOrder === "asc" ? "▲" : "▼")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]/30">
                  {paginatedVisitors.map((v) => (
                    <tr key={v.id} className="hover:bg-white/[0.01]">
                      <td className="py-3 font-medium text-zinc-200">
                        <Link 
                          href={`/admin/analytics/visitors/${v.id}`} 
                          className="font-mono text-zinc-300 hover:text-white transition underline flex items-center gap-1.5"
                        >
                          {v.id.substring(0, 12)}... <LuExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                      <td className="py-3 text-zinc-300">
                        {v.city && v.country ? `${v.city}, ${v.country}` : v.country || "Unknown"}
                      </td>
                      <td className="py-3 text-zinc-400 flex items-center gap-2 capitalize">
                        {getDeviceIcon(v.device)}
                        {v.browser || "Browser"}
                      </td>
                      <td className="py-3 text-right text-white font-mono font-semibold pr-2">{v.pageViewsCount} views</td>
                    </tr>
                  ))}
                  {filteredVisitors.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-zinc-600">No visitors match search query</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {totalVisitorPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#262626] pt-4 mt-6">
              <button
                onClick={() => setVisitorPage((p) => Math.max(p - 1, 1))}
                disabled={visitorPage === 1}
                className="bg-[#121212] border border-[#262626] px-3 py-1 text-[11px] font-mono hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-zinc-300"
              >
                PREV
              </button>
              <span className="text-[11px] font-mono text-zinc-500">
                PAGE {visitorPage} OF {totalVisitorPages}
              </span>
              <button
                onClick={() => setVisitorPage((p) => Math.min(p + 1, totalVisitorPages))}
                disabled={visitorPage === totalVisitorPages}
                className="bg-[#121212] border border-[#262626] px-3 py-1 text-[11px] font-mono hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-zinc-300"
              >
                NEXT
              </button>
            </div>
          )}
        </div>

        {/* Referral Logs Table */}
        <div data-tour="referrer-visitors-log" className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="font-syne text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <LuClock className="w-5 h-5 text-amber-500" /> Recent Referral Log
              </h2>
              <input
                type="text"
                placeholder="Search pages or URLs..."
                value={logSearch}
                onChange={(e) => {
                  setLogSearch(e.target.value);
                  setLogPage(1);
                }}
                className="w-full sm:w-48 bg-[#121212] border border-[#262626] px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
              />
            </div>
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-[#262626] text-zinc-500 font-mono text-[10px] uppercase">
                    <th 
                      className="pb-3 font-medium cursor-pointer hover:text-white transition select-none"
                      onClick={() => handleLogSort("path")}
                    >
                      Page Visited {logSortField === "path" && (logSortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th 
                      className="pb-3 font-medium cursor-pointer hover:text-white transition select-none"
                      onClick={() => handleLogSort("referrer")}
                    >
                      Full Raw Referrer URL {logSortField === "referrer" && (logSortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th 
                      className="pb-3 text-right font-medium pr-2 cursor-pointer hover:text-white transition select-none"
                      onClick={() => handleLogSort("timestamp")}
                    >
                      Timestamp {logSortField === "timestamp" && (logSortOrder === "asc" ? "▲" : "▼")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]/30">
                  {paginatedLogs.map((pv) => (
                    <tr key={pv.id} className="hover:bg-white/[0.01]">
                      <td className="py-3 font-semibold text-zinc-200 font-mono truncate max-w-[200px]" title={pv.path}>
                        {pv.path}
                      </td>
                      <td className="py-3 text-zinc-400 truncate max-w-[280px] font-mono text-[11px]" title={pv.referrer || ""}>
                        {pv.referrer}
                      </td>
                      <td className="py-3 text-right text-zinc-500 font-mono text-[11px]">
                        {formatDateTime(pv.timestamp)}
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-zinc-600">No referral logs found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {totalLogPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#262626] pt-4 mt-6">
              <button
                onClick={() => setLogPage((p) => Math.max(p - 1, 1))}
                disabled={logPage === 1}
                className="bg-[#121212] border border-[#262626] px-3 py-1 text-[11px] font-mono hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-zinc-300"
              >
                PREV
              </button>
              <span className="text-[11px] font-mono text-zinc-500">
                PAGE {logPage} OF {totalLogPages}
              </span>
              <button
                onClick={() => setLogPage((p) => Math.min(p + 1, totalLogPages))}
                disabled={logPage === totalLogPages}
                className="bg-[#121212] border border-[#262626] px-3 py-1 text-[11px] font-mono hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition text-zinc-300"
              >
                NEXT
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
