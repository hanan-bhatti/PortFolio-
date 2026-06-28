"use client";

/**
 * @file components/admin/EngagementOverviewClient.tsx
 * @description Interactive client-side component displaying stats overview, filter controls,
 * comparisons table, and content gaps search log for administrative analytics review.
 * 
 * @exports
 * - EngagementOverviewClient (default): Main overview display component
 */

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  LuSmile,
  LuThumbsUp,
  LuStar,
  LuMessageSquare,
  LuClipboardCheck,
  LuLogOut,
  LuBell,
  LuFileText,
  LuCalendar,
  LuSettings,
  LuClock,
  LuActivity,
  LuInfo
} from "react-icons/lu";

interface PostItem {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  createdAt: string;
  views: number;
  estReadTimeMins: number;
  config: {
    emojiReactionsOn: boolean;
    helpfulVoteOn: boolean;
    starRatingOn: boolean;
    sectionReactionsOn: boolean;
    endSurveyOn: boolean;
    difficultyToggleOn: boolean;
    exitIntentOn: boolean;
    notifyMeOn: boolean;
  };
  metrics: {
    emojiCount: number;
    helpful: { yes: number; no: number };
    rating: { average: number; total: number };
    scrollCompletionRate: number;
    avgTimeOnPageMins: number;
  };
}

interface ContentGap {
  query: string;
  count: number;
}

interface Props {
  posts: PostItem[];
  contentGaps: ContentGap[];
  summary: {
    totalReactions: number;
    totalSurveyResponses: number;
    totalNotifySignups: number;
  };
}

export default function EngagementOverviewClient({ posts, contentGaps, summary }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "reactions" | "helpful" | "views" | "scroll">("recent");
  const [filterFeature, setFilterFeature] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"all" | "7d" | "30d">("all");

  // Filtering posts
  const filteredPosts = posts.filter((post) => {
    // 1. Search filter
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // 2. Feature toggle filter
    if (filterFeature !== "all") {
      const cfg = post.config as Record<string, boolean>;
      if (!cfg[filterFeature]) return false;
    }

    // 3. Date range filter
    if (dateRange !== "all") {
      const createdDate = new Date(post.createdAt);
      const limitDate = new Date();
      if (dateRange === "7d") {
        limitDate.setDate(limitDate.getDate() - 7);
      } else {
        limitDate.setDate(limitDate.getDate() - 30);
      }
      if (createdDate < limitDate) return false;
    }

    return true;
  });

  // Sorting posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "reactions") {
      return b.metrics.emojiCount - a.metrics.emojiCount;
    }
    if (sortBy === "views") {
      return b.views - a.views;
    }
    if (sortBy === "scroll") {
      return a.metrics.scrollCompletionRate - b.metrics.scrollCompletionRate;
    }
    if (sortBy === "helpful") {
      const aTotal = a.metrics.helpful.yes + a.metrics.helpful.no;
      const bTotal = b.metrics.helpful.yes + b.metrics.helpful.no;
      const aRate = aTotal > 0 ? a.metrics.helpful.yes / aTotal : 0;
      const bRate = bTotal > 0 ? b.metrics.helpful.yes / bTotal : 0;
      return bRate - aRate;
    }
    return 0;
  });

  return (
    <div className="space-y-8 text-left">
      {/* Overview Stat Strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Emojis", val: summary.totalReactions, desc: "Reactions recorded across all posts" },
          { label: "Surveys Received", val: summary.totalSurveyResponses, desc: "End-post suggestions submitted" },
          { label: "Notification Follows", val: summary.totalNotifySignups, desc: "Email topic notifications requested" },
        ].map((c) => (
          <div key={c.label} className="border border-[#262626] bg-[#0c0c0c] p-5 rounded-none flex flex-col justify-between h-[115px]">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-550">{c.label}</span>
            <div className="flex items-baseline gap-2">
              <span className="font-syne text-3xl font-bold text-white leading-none">{c.val}</span>
            </div>
            <span className="font-mono text-[9px] text-zinc-500 truncate">{c.desc}</span>
          </div>
        ))}
      </div>

      {/* Filter and Sort controls */}
      <div className="border border-[#262626] bg-[#0c0c0c]/40 p-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-4 font-mono text-xs">
          {/* Keyword Search */}
          <div className="sm:col-span-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search posts by title..."
              className="w-full rounded-none border border-[#262626] bg-[#0a0a0a] px-3 py-2 font-mono text-xs text-white placeholder-zinc-650 outline-none focus:border-amber transition-colors"
            />
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full rounded-none border border-[#262626] bg-[#0a0a0a] px-3 py-2 font-mono text-xs text-zinc-300 outline-none focus:border-amber transition-colors cursor-pointer"
            >
              <option value="recent">Sort: Recent</option>
              <option value="reactions">Sort: Most Reactions</option>
              <option value="helpful">Sort: Helpful Ratio</option>
              <option value="views">Sort: Most Views</option>
              <option value="scroll">Sort: Lowest Scroll (Audit)</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateRange}
              onChange={(e: any) => setDateRange(e.target.value)}
              className="w-full rounded-none border border-[#262626] bg-[#0a0a0a] px-3 py-2 font-mono text-xs text-zinc-300 outline-none focus:border-amber transition-colors cursor-pointer"
            >
              <option value="all">Date: All Time</option>
              <option value="7d">Date: Last 7 Days</option>
              <option value="30d">Date: Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Feature toggles filters */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[#262626]/40 pt-3 text-[11px] font-mono">
          <span className="text-zinc-500 mr-2 uppercase tracking-wide">Filter feature:</span>
          {[
            { label: "All Posts", value: "all" },
            { label: "Emojis ON", value: "emojiReactionsOn" },
            { label: "Helpful ON", value: "helpfulVoteOn" },
            { label: "Stars ON", value: "starRatingOn" },
            { label: "Survey ON", value: "endSurveyOn" },
            { label: "Exit Popup ON", value: "exitIntentOn" },
            { label: "Notify ON", value: "notifyMeOn" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilterFeature(item.value)}
              className={`px-2.5 py-1 border rounded-none cursor-pointer transition-colors ${
                filterFeature === item.value
                  ? "border-amber bg-amber/10 text-amber"
                  : "border-[#262626] bg-[#0c0c0c]/40 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comparisons Table */}
      <div className="border border-[#262626] bg-[#0c0c0c] overflow-x-auto min-w-0">
        <table className="w-full min-w-[800px] border-collapse font-sans text-left text-xs">
          <thead>
            <tr className="border-b border-[#262626] bg-black/20 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-550">
              <th className="px-5 py-3">
                <span className="flex items-center gap-1">
                  <LuFileText className="w-3.5 h-3.5 text-zinc-500" /> Post Title
                </span>
              </th>
              <th className="px-4 py-3">
                <span className="flex items-center gap-1">
                  <LuCalendar className="w-3.5 h-3.5 text-zinc-500" /> Published
                </span>
              </th>
              <th className="px-4 py-3">
                <span className="flex items-center gap-1">
                  <LuSettings className="w-3.5 h-3.5 text-zinc-500" /> Active Config
                </span>
              </th>
              <th className="px-4 py-3 text-right">
                <span className="flex items-center gap-1 justify-end">
                  <LuSmile className="w-3.5 h-3.5 text-zinc-500" /> Emojis
                </span>
              </th>
              <th className="px-4 py-3 text-right">
                <span className="flex items-center gap-1 justify-end">
                  <LuThumbsUp className="w-3.5 h-3.5 text-zinc-500" /> Helpful Ratio
                </span>
              </th>
              <th className="px-4 py-3 text-right">
                <span className="flex items-center gap-1 justify-end">
                  <LuStar className="w-3.5 h-3.5 text-zinc-500" /> Rating
                </span>
              </th>
              <th className="px-4 py-3 text-right">
                <span className="flex items-center gap-1 justify-end">
                  <LuActivity className="w-3.5 h-3.5 text-zinc-500" /> Scroll Depth
                </span>
              </th>
              <th className="px-5 py-3 text-right">
                <span className="flex items-center gap-1 justify-end">
                  <LuClock className="w-3.5 h-3.5 text-zinc-500" /> Read Time
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626]/40 text-zinc-300">
            {sortedPosts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-zinc-500 font-mono">
                  No post engagement data matches active search/filter criteria.
                </td>
              </tr>
            ) : (
              sortedPosts.map((post) => {
                const totalHelpful = post.metrics.helpful.yes + post.metrics.helpful.no;
                const helpfulPercent = totalHelpful > 0 ? Math.round((post.metrics.helpful.yes / totalHelpful) * 100) : null;
                const avgMins = post.metrics.avgTimeOnPageMins;
                const estMins = post.estReadTimeMins;
                // Skimming warning: average reading time is less than half of estimated read time
                const isSkimming = avgMins > 0 && avgMins < estMins / 2;

                return (
                  <tr key={post.id} className="hover:bg-white/[0.01] transition-colors">
                    {/* Title */}
                    <td className="px-5 py-3.5 font-medium max-w-[240px] truncate">
                      <Link
                        href={`/admin/posts/${post.id}/engagement`}
                        className="text-zinc-200 hover:text-amber font-syne font-bold leading-snug transition-colors"
                      >
                        {post.title}
                      </Link>
                    </td>

                    {/* Published Date */}
                    <td className="px-4 py-3.5 font-mono text-[10px] text-zinc-500">
                      {formatDate(post.createdAt)}
                    </td>

                    {/* Active Config Flags */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { key: "emojiReactionsOn", label: "Emoji Reactions", icon: <LuSmile className="w-3.5 h-3.5 flex-shrink-0" />, activeColor: "border-emerald-900/60 bg-emerald-950/40 text-emerald-400" },
                          { key: "helpfulVoteOn", label: "Helpful Feedback", icon: <LuThumbsUp className="w-3.5 h-3.5 flex-shrink-0" />, activeColor: "border-sky-900/60 bg-sky-950/40 text-sky-400" },
                          { key: "starRatingOn", label: "Star Ratings", icon: <LuStar className="w-3.5 h-3.5 flex-shrink-0" />, activeColor: "border-amber-900/60 bg-amber-950/40 text-amber-400" },
                          { key: "sectionReactionsOn", label: "Section Comments", icon: <LuMessageSquare className="w-3.5 h-3.5 flex-shrink-0" />, activeColor: "border-violet-900/60 bg-violet-950/40 text-violet-400" },
                          { key: "endSurveyOn", label: "Post-End Survey", icon: <LuClipboardCheck className="w-3.5 h-3.5 flex-shrink-0" />, activeColor: "border-fuchsia-900/60 bg-fuchsia-950/40 text-fuchsia-400" },
                          { key: "exitIntentOn", label: "Exit Intent Popup", icon: <LuLogOut className="w-3.5 h-3.5 flex-shrink-0" />, activeColor: "border-rose-900/60 bg-rose-950/40 text-rose-400" },
                          { key: "notifyMeOn", label: "Newsletter Notify Me", icon: <LuBell className="w-3.5 h-3.5 flex-shrink-0" />, activeColor: "border-teal-900/60 bg-teal-950/40 text-teal-400" },
                        ].map((cfg) => {
                          const active = (post.config as any)[cfg.key];
                          return (
                            <span
                              key={cfg.key}
                              className={`p-1 border rounded-none flex items-center justify-center transition-all ${
                                active
                                  ? `${cfg.activeColor} border`
                                  : "border-zinc-900 bg-transparent text-zinc-700 opacity-20"
                              }`}
                              title={`${cfg.label}: ${active ? "Active" : "Disabled"}`}
                            >
                              {cfg.icon}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Emoji Counts */}
                    <td className="px-4 py-3.5 font-mono text-right font-medium">
                      {post.config.emojiReactionsOn ? (
                        post.metrics.emojiCount > 0 ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold bg-zinc-800/40 text-zinc-300 border border-zinc-700/60 rounded-none w-fit">
                            {post.metrics.emojiCount}
                          </span>
                        ) : (
                          <span className="text-zinc-650">0</span>
                        )
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>

                    {/* Helpful Ratio */}
                    <td className="px-4 py-3.5 font-mono text-right">
                      {post.config.helpfulVoteOn ? (
                        totalHelpful > 0 ? (
                          <span 
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold border rounded-none w-fit ${
                              helpfulPercent !== null && helpfulPercent >= 70
                                ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/60"
                                : "bg-amber-950/40 text-amber-400 border-amber-900/60"
                            }`}
                            title={`${post.metrics.helpful.yes} of ${totalHelpful} voters found this helpful`}
                          >
                            {helpfulPercent}% <span className="text-[9px] opacity-60">({totalHelpful})</span>
                          </span>
                        ) : (
                          <span className="text-zinc-650">0%</span>
                        )
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>

                    {/* Ratings */}
                    <td className="px-4 py-3.5 font-mono text-right">
                      {post.config.starRatingOn ? (
                        post.metrics.rating.total > 0 ? (
                          <span 
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-amber-950/40 text-amber-400 border border-amber-900/60 rounded-none w-fit"
                            title={`Average star rating from ${post.metrics.rating.total} submissions`}
                          >
                            ★ {post.metrics.rating.average} <span className="text-[9px] opacity-60">({post.metrics.rating.total})</span>
                          </span>
                        ) : (
                          <span className="text-zinc-655">Unrated</span>
                        )
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>

                    {/* Scroll rate */}
                    <td className="px-4 py-3.5 font-mono text-right">
                      <span 
                        className={`inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold border rounded-none w-fit ${
                          post.metrics.scrollCompletionRate >= 50
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/60"
                            : "bg-zinc-800/40 text-zinc-400 border-zinc-700/60"
                        }`}
                      >
                        {post.metrics.scrollCompletionRate}%
                      </span>
                    </td>

                    {/* Time vs Estimate */}
                    <td className="px-5 py-3.5 font-mono text-right">
                      {isSkimming ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 border border-rose-900/60 bg-rose-950/40 text-rose-400 text-[11px] font-bold rounded-none w-fit"
                          title="Reader skimming warning: Avg read time is under half the estimated read time"
                        >
                          <LuInfo className="w-3 h-3 text-rose-400 flex-shrink-0" /> {avgMins}m / {estMins}m
                        </span>
                      ) : (
                        <span 
                          className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold bg-zinc-800/40 text-zinc-300 border border-zinc-700/60 rounded-none w-fit"
                          title="Average read time vs Estimated read time"
                        >
                          {avgMins}m / {estMins}m
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Content Gaps Site Search queries log */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
        <div className="space-y-1">
          <h3 className="font-syne text-base font-bold text-white uppercase tracking-wider">
            Content Gaps analyzer
          </h3>
          <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
            Top search queries returning zero results — write articles to fill these gaps
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {contentGaps.length === 0 ? (
            <div className="sm:col-span-2 md:col-span-3 border border-[#262626]/40 p-5 text-center text-zinc-500 font-mono text-xs">
              No search gap queries recorded. All site searches returned results.
            </div>
          ) : (
            contentGaps.map((cg) => (
              <div
                key={cg.query}
                className="border border-[#262626] bg-[#080808] px-4 py-3.5 flex justify-between items-center rounded-none font-mono text-xs"
              >
                <span className="text-zinc-300 font-bold max-w-[70%] truncate" title={cg.query}>
                  &quot;{cg.query}&quot;
                </span>
                <span className="px-2 py-0.5 border border-red-500/20 bg-red-950/10 text-red-400 text-[10px] font-bold">
                  {cg.count} searches
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
