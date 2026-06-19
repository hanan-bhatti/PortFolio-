/**
 * @file app/admin/(protected)/analytics/AnalyticsDashboardClient.tsx
 * @description Client-side dashboard component for managing filter state and rendering charts/tables.
 * 
 * @exports
 * - AnalyticsDashboardClient (default): React client component
 */

"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { getAnalyticsData, type AnalyticsData, type AnalyticsFiltersState } from "./actions";

interface AnalyticsDashboardClientProps {
  initialData: AnalyticsData;
  countries: string[];
  initialFilters: AnalyticsFiltersState;
}

export default function AnalyticsDashboardClient({
  initialData,
  countries,
  initialFilters,
}: AnalyticsDashboardClientProps) {
  const [filters, setFilters] = useState<AnalyticsFiltersState>(initialFilters);
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [isPending, startTransition] = useTransition();
  const [pathInput, setPathInput] = useState(filters.path);

  // Sync state if initialFilters change (e.g. on mount/reset)
  useEffect(() => {
    setFilters(initialFilters);
    setPathInput(initialFilters.path);
    setData(initialData);
  }, [initialFilters, initialData]);

  const handleFilterChange = (updates: Partial<AnalyticsFiltersState>) => {
    const nextFilters = { ...filters, ...updates };
    setFilters(nextFilters);

    // Shallow update of browser URL searchParams
    const params = new URLSearchParams();
    if (nextFilters.range && nextFilters.range !== "30d") params.set("range", nextFilters.range);
    if (nextFilters.path) params.set("path", nextFilters.path);
    if (nextFilters.device) params.set("device", nextFilters.device);
    if (nextFilters.country) params.set("country", nextFilters.country);
    if (nextFilters.chartRange && nextFilters.chartRange !== "30d") params.set("chartRange", nextFilters.chartRange);

    const queryString = params.toString();
    const newUrl = window.location.pathname + (queryString ? `?${queryString}` : "");
    window.history.pushState(null, "", newUrl);

    // Fetch the filtered analytics data reactively
    startTransition(async () => {
      try {
        const newData = await getAnalyticsData(nextFilters);
        setData(newData);
      } catch (err) {
        console.error("Failed to fetch analytics data", err);
      }
    });
  };

  const handlePathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange({ path: pathInput });
  };

  const handleClearFilters = () => {
    setPathInput("");
    handleFilterChange({
      range: "30d",
      path: "",
      device: "",
      country: "",
    });
  };

  const handleChartRangeToggle = (newChartRange: string) => {
    handleFilterChange({ chartRange: newChartRange });
  };

  const stats = [
    { label: "Total Visitors", value: data.totalVisitors },
    { label: "Total Page Views", value: data.totalPageViews },
    { label: "Visitors Today", value: data.uniqueVisitorsToday },
    { label: "Page Views Today", value: data.pageViewsToday },
  ];

  const formatShortDate = (dateVal: Date | string) => {
    const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const peak = data.chartData.length > 0 ? Math.max(...data.chartData.map((d) => d.count), 0) : 0;
  const totalDevice = data.byDevice.reduce((acc, d) => acc + d.count, 0);
  const totalCountry = data.byCountry.reduce((acc, c) => acc + c.count, 0);
  const totalBrowser = data.byBrowser.reduce((acc, b) => acc + b.count, 0);
  const totalTraffic = data.trafficSources.reduce((acc, t) => acc + t.count, 0);

  return (
    <div className="space-y-8">
      {/* FILTER BAR PANEL */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-none">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex gap-1 border border-[#262626] p-1 bg-black/40 font-mono text-[11px] font-semibold">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleFilterChange({ range: "30d" })}
              className={`px-3 py-1.5 transition-colors rounded-none cursor-pointer ${
                filters.range === "30d"
                  ? "bg-[#F59E0B] text-black font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleFilterChange({ range: "all" })}
              className={`px-3 py-1.5 transition-colors rounded-none cursor-pointer ${
                filters.range === "all"
                  ? "bg-[#F59E0B] text-black font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All Time
            </button>
          </div>

          {/* Device Select */}
          <select
            value={filters.device}
            disabled={isPending}
            onChange={(e) => handleFilterChange({ device: e.target.value })}
            className="border border-[#262626] bg-black/40 px-3 py-2 font-mono text-xs text-zinc-300 rounded-none focus:outline-none focus:border-[#F59E0B] cursor-pointer"
          >
            <option value="">All Devices</option>
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
            <option value="tablet">Tablet</option>
          </select>

          {/* Country Select */}
          <select
            value={filters.country}
            disabled={isPending}
            onChange={(e) => handleFilterChange({ country: e.target.value })}
            className="border border-[#262626] bg-black/40 px-3 py-2 font-mono text-xs text-zinc-300 rounded-none focus:outline-none focus:border-[#F59E0B] cursor-pointer"
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Path Search Form */}
        <form onSubmit={handlePathSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Filter by path (e.g. /blog)..."
            value={pathInput}
            onChange={(e) => setPathInput(e.target.value)}
            className="w-full md:w-[220px] border border-[#262626] bg-black/40 px-3 py-2 font-mono text-xs text-white rounded-none focus:outline-none focus:border-[#F59E0B]"
          />
          <button
            type="submit"
            disabled={isPending}
            className="border border-[#262626] bg-black/60 px-4 py-2 font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider hover:border-[#F59E0B] hover:text-[#F59E0B] transition-colors rounded-none cursor-pointer disabled:opacity-50"
          >
            Filter
          </button>
          {pathInput || filters.device || filters.country || filters.range !== "30d" ? (
            <button
              type="button"
              disabled={isPending}
              onClick={handleClearFilters}
              className="border border-red-500/20 bg-red-500/5 px-3 py-2 font-mono text-xs font-bold text-red-400 uppercase hover:border-red-500 hover:text-red-500 transition-colors rounded-none cursor-pointer"
            >
              Clear
            </button>
          ) : null}
        </form>
      </div>

      {/* LOADING OVERLAY INDICATOR */}
      {isPending && (
        <div className="flex items-center gap-2 font-mono text-xs text-[#F59E0B] animate-pulse">
          <span>⚡</span> Updating metrics and dashboard view...
        </div>
      )}

      {/* ROW 1: 4 Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border border-[#262626] bg-[#0c0c0c] p-4 flex flex-col justify-between h-[115px] rounded-none"
          >
            <p className="font-mono text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-snug">{stat.label}</p>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-bold font-mono text-[#F59E0B] tracking-tight leading-none">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ROW 2: CSS Chart */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 min-w-0 overflow-hidden rounded-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="font-syne text-lg font-bold text-white">
            Page Views ({filters.chartRange === "30d" ? "Last 30 Days" : "All Time"})
          </h3>
          <div className="flex gap-1 border border-[#262626] p-1 bg-black/40 font-mono text-[11px] font-semibold">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleChartRangeToggle("30d")}
              className={`px-3 py-1 transition-colors rounded-none cursor-pointer ${
                filters.chartRange === "30d"
                  ? "bg-[#F59E0B] text-black font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleChartRangeToggle("all")}
              className={`px-3 py-1 transition-colors rounded-none cursor-pointer ${
                filters.chartRange === "all"
                  ? "bg-[#F59E0B] text-black font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-none pb-2">
          <div className={`flex h-[200px] items-end gap-1.5 sm:gap-2 ${filters.chartRange === "30d" ? "min-w-[450px] sm:min-w-0" : "w-full"}`}>
            {data.chartData.map((day, idx) => {
              const heightPercent = peak > 0 ? (day.count / peak) * 100 : 0;
              const heightStr = peak === 0 ? "4px" : day.count === 0 ? "0px" : `${Math.max(2, heightPercent)}%`;

              return (
                <div key={idx} className="group relative flex h-full flex-1 flex-col justify-end">
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-none border border-[#262626] bg-black px-2 py-1 font-mono text-[10px] text-white whitespace-nowrap z-25 group-hover:block">
                    {day.tooltip}
                  </div>
                  {/* Bar */}
                  <div
                    style={{ height: heightStr }}
                    className="w-full bg-[#F59E0B] hover:bg-white transition-colors duration-200"
                  />
                  {/* X Axis Label */}
                  <span className="mt-2 block text-center font-mono text-[9px] text-zinc-500 text-ellipsis overflow-hidden whitespace-nowrap">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROW 3: Top Pages & Top Referrers */}
      <div className="grid gap-6 lg:grid-cols-2 min-w-0">
        {/* Left Column: Top Pages */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 min-w-0 overflow-hidden rounded-none">
          <h3 className="mb-4 font-syne text-lg font-bold text-white">Top Pages</h3>
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full table-fixed text-left font-sans text-[13px]">
              <colgroup>
                <col className="w-[75%] sm:w-[80%]" />
                <col className="w-[25%] sm:w-[20%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#262626] text-zinc-500 font-mono text-xs uppercase">
                  <th className="pb-3 font-medium pl-2">Path</th>
                  <th className="pb-3 text-right font-medium pr-2">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]/50">
                {data.topPages.map((page, index) => (
                  <tr
                    key={page.path}
                    className={index % 2 === 1 ? "bg-[#0c0c0c]" : "bg-black/10"}
                  >
                    <td className="py-3 px-2 font-mono text-zinc-300 min-w-0">
                      <span className="block truncate" title={page.path}>{page.path}</span>
                    </td>
                    <td className="py-3 text-right text-white font-semibold pr-2">{page.count}</td>
                  </tr>
                ))}
                {data.topPages.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-zinc-600">No views tracked yet</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Top Referrers */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 min-w-0 overflow-hidden rounded-none">
          <h3 className="mb-4 font-syne text-lg font-bold text-white">Top Referrers</h3>
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full table-fixed text-left font-sans text-[13px]">
              <colgroup>
                <col className="w-[75%] sm:w-[80%]" />
                <col className="w-[25%] sm:w-[20%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#262626] text-zinc-500 font-mono text-xs uppercase">
                  <th className="pb-3 font-medium pl-2">Referrer</th>
                  <th className="pb-3 text-right font-medium pr-2">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]/50">
                {data.topReferrers.map((ref, index) => (
                  <tr
                    key={ref.referrer}
                    className={index % 2 === 1 ? "bg-[#0c0c0c]" : "bg-black/10"}
                  >
                    <td className="py-3 px-2 font-mono text-zinc-300 min-w-0">
                      <span className="block truncate" title={ref.referrer}>{ref.referrer}</span>
                    </td>
                    <td className="py-3 text-right text-white font-semibold pr-2">{ref.count}</td>
                  </tr>
                ))}
                {data.topReferrers.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-zinc-600">No referrers tracked yet</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Traffic Sources & UTM Campaigns */}
      <div className={`grid gap-6 min-w-0 ${data.utmCampaigns.length > 0 ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Traffic Sources */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-6 min-w-0 overflow-hidden rounded-none">
          <h3 className="font-syne text-lg font-bold text-white">Traffic Sources</h3>
          <div className="space-y-4">
            {data.trafficSources.filter((s) => s.count > 0).map((source) => {
              const percent = totalTraffic > 0 ? Math.round((source.count / totalTraffic) * 100) : 0;
              return (
                <div key={source.key ?? source.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300">{source.name}</span>
                    <span className="text-zinc-500">{source.count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-[#262626] h-2.5 rounded-none overflow-hidden">
                    <div
                      className="bg-[#F59E0B] h-full rounded-none transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* UTM Campaigns (Only if any exist) */}
        {data.utmCampaigns.length > 0 && (
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-4 min-w-0 overflow-hidden rounded-none">
            <h3 className="font-syne text-lg font-bold text-white">UTM Campaigns</h3>
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full table-fixed text-left font-sans text-[13px]">
                <colgroup>
                  <col className="w-[45%] sm:w-[35%]" />
                  <col className="w-[30%] sm:w-[25%]" />
                  <col className="w-[0%] sm:w-[25%] hidden sm:table-column" />
                  <col className="w-[25%] sm:w-[15%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-[#262626] text-zinc-500 font-mono text-xs uppercase">
                    <th className="pb-3 font-medium pl-2">Campaign</th>
                    <th className="pb-3 font-medium">Source</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Medium</th>
                    <th className="pb-3 text-right font-medium pr-2">Visits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]/50">
                  {data.utmCampaigns.map((utm, index) => (
                    <tr
                      key={`${utm.campaign}-${utm.source}-${utm.medium}`}
                      className={index % 2 === 1 ? "bg-[#0c0c0c]" : "bg-black/10"}
                    >
                      <td className="py-3 px-2 font-mono text-[#F59E0B] font-semibold min-w-0">
                        <span className="block truncate" title={utm.campaign}>{utm.campaign}</span>
                      </td>
                      <td className="py-3 font-mono text-zinc-300 min-w-0">
                        <span className="block truncate" title={utm.source}>{utm.source}</span>
                      </td>
                      <td className="py-3 font-mono text-zinc-400 min-w-0 hidden sm:table-cell">
                        <span className="block truncate" title={utm.medium}>{utm.medium}</span>
                      </td>
                      <td className="py-3 text-right text-white font-semibold pr-2">{utm.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ROW 4: Countries, Devices, and Browsers Breakdown */}
      <div className="grid gap-6 md:grid-cols-3 min-w-0">
        {/* Countries Breakdown */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-4 min-w-0 overflow-hidden rounded-none">
          <h3 className="font-syne text-lg font-bold text-white">Countries</h3>
          <div className="space-y-3">
            {data.byCountry.slice(0, 5).map((c) => {
              const percent = totalCountry > 0 ? Math.round((c.count / totalCountry) * 100) : 0;
              return (
                <div key={c.country} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300">{c.country}</span>
                    <span className="text-zinc-500">{c.count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-[#262626] h-1.5 rounded-none overflow-hidden">
                    <div className="bg-[#F59E0B] h-full rounded-none" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
            {data.byCountry.length === 0 ? <p className="text-sm text-zinc-500 text-center py-4">No country data yet</p> : null}
          </div>
        </div>

        {/* Devices Breakdown */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-4 min-w-0 overflow-hidden rounded-none">
          <h3 className="font-syne text-lg font-bold text-white">Devices</h3>
          <div className="space-y-3">
            {data.byDevice.map((d) => {
              const percent = totalDevice > 0 ? Math.round((d.count / totalDevice) * 100) : 0;
              return (
                <div key={d.device} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300 capitalize">{d.device}</span>
                    <span className="text-zinc-500">{d.count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-[#262626] h-1.5 rounded-none overflow-hidden">
                    <div className="bg-[#F59E0B] h-full rounded-none" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
            {data.byDevice.length === 0 ? <p className="text-sm text-zinc-500 text-center py-4">No device data yet</p> : null}
          </div>
        </div>

        {/* Browsers Breakdown */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-4 min-w-0 overflow-hidden rounded-none">
          <h3 className="font-syne text-lg font-bold text-white">Browsers</h3>
          <div className="space-y-3">
            {data.byBrowser.slice(0, 5).map((b) => {
              const percent = totalBrowser > 0 ? Math.round((b.count / totalBrowser) * 100) : 0;
              return (
                <div key={b.browser} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300">{b.browser}</span>
                    <span className="text-zinc-500">{b.count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-[#262626] h-1.5 rounded-none overflow-hidden">
                    <div className="bg-[#F59E0B] h-full rounded-none" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
            {data.byBrowser.length === 0 ? <p className="text-sm text-zinc-500 text-center py-4">No browser data yet</p> : null}
          </div>
        </div>
      </div>

      {/* ROW 5: Recent Visitors */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 min-w-0 overflow-hidden rounded-none">
        <h3 className="mb-4 font-syne text-lg font-bold text-white">Recent Visitors</h3>
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left font-sans text-[13px]">
            <thead>
              <tr className="border-b border-[#262626] text-zinc-500 font-mono text-xs uppercase">
                <th className="pb-3 font-medium pl-2">Country</th>
                <th className="pb-3 font-medium hidden sm:table-cell">Device</th>
                <th className="pb-3 font-medium hidden md:table-cell">Browser</th>
                <th className="pb-3 font-medium hidden lg:table-cell">First Seen</th>
                <th className="pb-3 font-medium">Last Seen</th>
                <th className="pb-3 text-right font-medium hidden sm:table-cell">Visits</th>
                <th className="pb-3 text-right font-medium pr-2">Pages</th>
                <th className="pb-3 text-center font-medium hidden md:table-cell">Consent</th>
                <th className="pb-3 text-right font-medium hidden md:table-cell">Forms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]/50">
              {data.recentVisitors.map((visitor) => (
                <tr key={visitor.id} className="hover:bg-white/[0.01]">
                  <td className="py-4 font-medium text-zinc-200 pl-2">
                    <span className="block truncate max-w-[120px] sm:max-w-none" title={
                      visitor.city && visitor.country
                        ? `${visitor.city}, ${visitor.country}`
                        : visitor.country || ""
                    }>
                      {visitor.city && visitor.country
                        ? `${visitor.city}, ${visitor.country}`
                        : visitor.country || "—"}
                    </span>
                  </td>
                  <td className="py-4 text-zinc-400 capitalize hidden sm:table-cell">{visitor.device || "—"}</td>
                  <td className="py-4 text-zinc-400 hidden md:table-cell">
                    <span className="block truncate max-w-[100px]" title={visitor.browser || ""}>
                      {visitor.browser || "—"}
                    </span>
                  </td>
                  <td className="py-4 text-zinc-500 font-mono text-[11px] hidden lg:table-cell">
                    {formatShortDate(visitor.firstSeen)}
                  </td>
                  <td className="py-4 text-zinc-500 font-mono text-[11px]">
                    {formatShortDate(visitor.lastSeen)}
                  </td>
                  <td className="py-4 text-right text-white font-semibold font-mono hidden sm:table-cell">{visitor.visits}</td>
                  <td className="py-4 text-right text-white font-semibold font-mono pr-2">
                    {visitor._count.pageViews}
                  </td>
                  <td className="py-4 text-center hidden md:table-cell">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded-none text-[10px] font-mono font-semibold ${
                        visitor.consentType === "all"
                          ? "bg-green-950 text-emerald-400 border border-emerald-900"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      }`}
                    >
                      {visitor.consentType}
                    </span>
                  </td>
                  <td className="py-4 text-right hidden md:table-cell pr-2">
                    {visitor._count.formSubmissions > 0 ? (
                      <span className="inline-block rounded-none bg-emerald-950 border border-emerald-900 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                        ✉ Contact
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {data.recentVisitors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-zinc-600">No visitors tracked yet</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
