"use client";

/**
 * @file components/admin/PostEngagementDrilldownClient.tsx
 * @description Client-side component displaying aggregated detailed analytics,
 * including star rating distributions, scroll funnels, section reaction density heatmaps,
 * UTM attributions, and suggestion lists.
 * 
 * @exports
 * - PostEngagementDrilldownClient (default): Drill-down engagement view component
 */

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  LuGlobe,
  LuMegaphone
} from "react-icons/lu";
import {
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaGoogle
} from "react-icons/fa6";
import { classifyReferrer } from "@/lib/classify-referrer";

function getReferrerBrandIcon(source: string) {
  switch (source) {
    case "linkedin":
      return <FaLinkedin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#0A66C2" }} />;
    case "github":
      return <FaGithub className="w-3.5 h-3.5 flex-shrink-0 text-white" />;
    case "twitter":
    case "x":
      return <FaTwitter className="w-3.5 h-3.5 flex-shrink-0 text-sky-400" />;
    case "facebook":
      return <FaFacebook className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />;
    case "instagram":
      return <FaInstagram className="w-3.5 h-3.5 flex-shrink-0 text-pink-500" />;
    case "google":
      return <FaGoogle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" style={{ color: "#EA4335" }} />;
    default:
      return <LuGlobe className="w-3.5 h-3.5 flex-shrink-0 text-zinc-500" />;
  }
}

interface TocHeading {
  id: string;
  text: string;
  level: number;
}

interface Props {
  postId: string;
  postTitle: string;
  postSlug: string;
  postCreatedAt: string;
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
    totalVisitors: number;
    totalInteracted: number;
    estReadTimeMins: number;
    avgTimeOnPageMins: number;
    medianTimeOnPageMins: number;
    avgTimeSeconds: number;
    medianTimeSeconds: number;
    scrollCompletionRate: number;
    emoji: {
      summary: Record<string, number>;
      total: number;
    };
    helpful: {
      yes: number;
      no: number;
    };
    rating: {
      average: number;
      distribution: Record<number, number>;
      total: number;
    };
    scrollFunnel: {
      total: number;
      v25: number;
      v50: number;
      v75: number;
      v100: number;
    };
    engagementRates: {
      bounceRate: number;
      exploredRate: number;
    };
    sectionSummary: Record<
      string,
      {
        total: number;
        emojiCounts: Record<string, number>;
        dominantEmoji: string;
      }
    >;
    toc: TocHeading[];
    topCopiedBlocks: { blockId: string; codeBlock?: string; count: number }[];
    traffic: {
      referrers: { name: string; count: number }[];
      utm: {
        sources: { name: string; count: number }[];
        mediums: { name: string; count: number }[];
        campaigns: { name: string; count: number }[];
      };
    };
    survey: {
      difficulty: {
        too_basic: number;
        just_right: number;
        too_advanced: number;
        total: number;
      };
      suggestions: {
        id: string;
        text: string;
        difficulty: string | null;
        createdAt: string;
      }[];
    };
    notify: {
      id: string;
      email: string;
      topic: string | null;
      createdAt: string;
    }[];
  };
}

export default function PostEngagementDrilldownClient({
  postId,
  postTitle,
  postSlug,
  postCreatedAt,
  config,
  metrics,
}: Props) {
  // Suggestions Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalSuggestions = metrics.survey.suggestions.length;
  const totalPages = Math.ceil(totalSuggestions / itemsPerPage);
  const paginatedSuggestions = metrics.survey.suggestions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Time formatting helper
  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Section heat intensities lookup helper
  const maxSectionReactions = Object.values(metrics.sectionSummary).reduce(
    (max, s) => Math.max(max, s.total),
    0
  );

  // Checks whether there is traffic analytics data
  const hasTrafficData =
    metrics.traffic.referrers.length > 0 ||
    metrics.traffic.utm.sources.length > 0 ||
    metrics.traffic.utm.mediums.length > 0 ||
    metrics.traffic.utm.campaigns.length > 0;

  return (
    <div className="space-y-6 text-left pb-20">
      {/* Dynamic Header Box */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-syne text-xl font-bold text-white tracking-wide">{postTitle}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-mono">
              <span>Published: {formatDate(postCreatedAt)}</span>
              <span>·</span>
              <a
                href={`/blog/${postSlug}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#F59E0B] hover:underline"
              >
                Live Post ↗
              </a>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              data-tour="post-engagement-edit-link"
              href={`/admin/posts/${postId}/edit`}
              className="border border-zinc-700 bg-transparent px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-white hover:border-zinc-500 transition-all rounded-none text-center"
            >
              Edit Settings
            </Link>
          </div>
        </div>

        {/* Quick-Glance Summary row */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 border-t border-[#262626]/40 pt-6">
          <div className="space-y-1">
            <span className="font-mono text-[9px] text-zinc-550 uppercase tracking-widest block">
              Unique Visitors
            </span>
            <span className="font-syne text-2xl font-bold text-white">
              {metrics.totalVisitors}
            </span>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-[9px] text-zinc-550 uppercase tracking-widest block">
              Active Engagements
            </span>
            <span className="font-syne text-2xl font-bold text-green">
              {metrics.totalInteracted}
            </span>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-[9px] text-zinc-550 uppercase tracking-widest block">
              Scroll Completion
            </span>
            <span className="font-syne text-2xl font-bold text-white">
              {metrics.scrollCompletionRate}%
            </span>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-[9px] text-zinc-550 uppercase tracking-widest block">
              Time on Page
            </span>
            <span className="font-syne text-2xl font-bold text-white">
              {formatSeconds(metrics.avgTimeSeconds)}
              <span className="text-[10px] text-zinc-500 font-mono font-normal ml-1">
                / {metrics.estReadTimeMins}m est.
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Sections: Reactions Section & Reading Behavior */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Reactions summary block */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-6">
          <h3 className="font-syne text-base font-bold text-white uppercase tracking-wider border-b border-[#262626]/40 pb-3">
            Interaction Summary
          </h3>

          {/* Emojis Breakdown */}
          {config.emojiReactionsOn ? (
            <div className="space-y-4">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
                Emoji Reactions ({metrics.emoji.total})
              </span>
              <div className="space-y-3 font-mono text-xs">
                {["👍", "🔥", "🤯", "❤️", "😂"].map((emoji) => {
                  const count = metrics.emoji.summary[emoji] || 0;
                  const pct =
                    metrics.emoji.total > 0 ? Math.round((count / metrics.emoji.total) * 100) : 0;
                  return (
                    <div key={emoji} className="space-y-1">
                      <div className="flex justify-between items-center text-zinc-400">
                        <span className="text-sm">{emoji}</span>
                        <span>
                          {count} <span className="text-zinc-550">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#080808] border border-[#262626] rounded-none overflow-hidden">
                        <div
                          className="h-full bg-[#F59E0B] transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="font-mono text-xs text-zinc-600 italic py-2">
              Emoji reactions were not enabled for this post.
            </p>
          )}

          {/* Helpful Vote & Ratings Star distribution */}
          <div className="grid gap-6 sm:grid-cols-2 border-t border-[#262626]/40 pt-6">
            {/* Helpful Vote */}
            {config.helpfulVoteOn ? (
              <div className="space-y-4">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
                  Helpful Votes
                </span>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-zinc-400 text-[11px]">
                    <span>YES: {metrics.helpful.yes}</span>
                    <span>NO: {metrics.helpful.no}</span>
                  </div>
                  {metrics.helpful.yes + metrics.helpful.no > 0 ? (
                    (() => {
                      const total = metrics.helpful.yes + metrics.helpful.no;
                      const yesPct = Math.round((metrics.helpful.yes / total) * 100);
                      return (
                        <div className="space-y-1">
                          <div className="h-3 w-full bg-[#080808] border border-[#262626] rounded-none flex overflow-hidden">
                            <div className="h-full bg-green" style={{ width: `${yesPct}%` }} />
                            <div
                              className="h-full bg-red-900/60"
                              style={{ width: `${100 - yesPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-zinc-500">
                            {yesPct}% found helpful
                          </span>
                        </div>
                      );
                    })()
                  ) : (
                    <span className="text-zinc-650 text-[10px]">No votes registered</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
                  Helpful Votes
                </span>
                <span className="font-mono text-xs text-zinc-650 italic">Disabled</span>
              </div>
            )}

            {/* Star Rating Distribution */}
            {config.starRatingOn ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
                    Average Rating
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold text-amber">★ {metrics.rating.average}</span>
                    <span className="text-[10px] text-zinc-500">
                      ({metrics.rating.total} reviews)
                    </span>
                  </div>
                </div>
                {/* 5-1 Star Histogram */}
                <div className="space-y-1.5 text-[10px]">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = metrics.rating.distribution[stars] || 0;
                    const pct =
                      metrics.rating.total > 0
                        ? Math.round((count / metrics.rating.total) * 100)
                        : 0;
                    return (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="w-8 text-zinc-500 text-right">{stars} ★</span>
                        <div className="flex-1 h-1.5 bg-[#080808] border border-[#262626]/60 rounded-none overflow-hidden">
                          <div className="h-full bg-amber" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-5 text-zinc-500 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
                  Star Rating
                </span>
                <span className="font-mono text-xs text-zinc-650 italic">Disabled</span>
              </div>
            )}
          </div>
        </div>

        {/* Reading Behavior (Scroll depth funnel, time split) */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-6">
          <h3 className="font-syne text-base font-bold text-white uppercase tracking-wider border-b border-[#262626]/40 pb-3">
            Reading Behavior
          </h3>

          {/* Scroll depth funnel */}
          <div className="space-y-3.5">
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
              Scroll Funnel Checkpoints
            </span>
            <div className="space-y-3.5 font-mono text-xs">
              {[
                { label: "25% - Landed / Began", val: metrics.scrollFunnel.v25 },
                { label: "50% - Halfway Point", val: metrics.scrollFunnel.v50 },
                { label: "75% - Detailed Read", val: metrics.scrollFunnel.v75 },
                { label: "100% - Post Completed", val: metrics.scrollFunnel.v100 },
              ].map((step) => {
                const total = metrics.scrollFunnel.total;
                const pct = total > 0 ? Math.round((step.val / total) * 100) : 0;
                return (
                  <div key={step.label} className="space-y-1.5">
                    <div className="flex justify-between text-zinc-400">
                      <span>{step.label}</span>
                      <span>
                        {step.val} <span className="text-zinc-550">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#080808] border border-[#262626] rounded-none overflow-hidden">
                      <div className="h-full bg-green" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bounce vs Explored rates */}
          <div className="border-t border-[#262626]/40 pt-5 space-y-4">
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
              Visitor Path Split
            </span>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between text-zinc-400 text-[11px]">
                <span>BOUNCED: {metrics.engagementRates.bounceRate}%</span>
                <span>EXPLORED: {metrics.engagementRates.exploredRate}%</span>
              </div>
              <div className="h-3.5 w-full bg-[#080808] border border-[#262626] rounded-none flex overflow-hidden">
                <div
                  className="h-full bg-red-950/20 border-r border-[#262626]/40"
                  style={{ width: `${metrics.engagementRates.bounceRate}%` }}
                />
                <div
                  className="h-full bg-green/10"
                  style={{ width: `${metrics.engagementRates.exploredRate}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 leading-normal">
                Explored rate represents readers who stayed past 30s or scrolled halfway down the content.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Heatmap vs Copied blocks */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Section Reactions Heatmap */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4 lg:col-span-2 text-left">
          <div className="space-y-1 border-b border-[#262626]/40 pb-3">
            <h3 className="font-syne text-base font-bold text-white uppercase tracking-wider">
              Section Reactions Heatmap
            </h3>
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              Visual overview of headings/sections weighted by reaction density
            </p>
          </div>

          {config.sectionReactionsOn ? (
            metrics.toc.length === 0 ? (
              <p className="font-mono text-xs text-zinc-500 italic py-4">
                No headings found in post content.
              </p>
            ) : (
              <div className="divide-y divide-[#262626]/40 font-mono text-xs max-h-[480px] overflow-y-auto pr-1">
                {metrics.toc.map((heading) => {
                  const data = metrics.sectionSummary[heading.id];
                  const total = data?.total || 0;
                  const dominant = data?.dominantEmoji || "";
                  
                  // Calculate opacity based on relative max reaction density
                  const opacity = maxSectionReactions > 0 ? total / maxSectionReactions : 0;
                  // Opacity bounds [0.03 to 0.25] for visible background shading
                  const bgOpacity = total > 0 ? 0.04 + opacity * 0.22 : 0;

                  return (
                    <div
                      key={heading.id}
                      className="py-3 flex justify-between items-center gap-4 transition-colors px-2"
                      style={{
                        backgroundColor: bgOpacity > 0 ? `rgba(245, 158, 11, ${bgOpacity})` : "transparent",
                      }}
                    >
                      <div
                        className="truncate"
                        style={{ paddingLeft: `${heading.level * 12}px` }}
                      >
                        <span className="text-zinc-500 mr-2 text-[10px]">H{heading.level + 1}</span>
                        <span className="text-zinc-200 font-medium" title={heading.text}>
                          {heading.text}
                        </span>
                      </div>
                      {total > 0 ? (
                        <span className="px-2 py-0.5 border border-amber/35 bg-amber/5 text-[10px] text-amber font-bold shrink-0">
                          {dominant} {total}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-650 shrink-0">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <p className="font-mono text-xs text-zinc-600 italic py-4">
              Section reactions were not enabled for this post.
            </p>
          )}
        </div>

        {/* Code Blocks Copies */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
          <div className="space-y-1 border-b border-[#262626]/40 pb-3">
            <h3 className="font-syne text-base font-bold text-white uppercase tracking-wider">
              Code Copies
            </h3>
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              Multiline block copies logged
            </p>
          </div>

          <div className="overflow-y-auto max-h-[480px]">
            {metrics.topCopiedBlocks.length === 0 ? (
              <div className="p-8 text-center text-zinc-650 font-mono text-xs italic">
                No code copies logged.
              </div>
            ) : (
              <div className="space-y-2.5 font-mono text-xs">
                {metrics.topCopiedBlocks.map((block) => (
                  <div
                    key={block.blockId}
                    className="border border-[#262626] bg-[#080808] px-3.5 py-3 space-y-2 rounded-none"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 font-bold max-w-[65%] truncate text-[10px] uppercase font-mono" title={block.blockId}>
                        {block.blockId}
                      </span>
                      <span className="px-2 py-0.5 border border-amber/25 bg-amber/5 text-amber text-[10px] font-bold shrink-0">
                        {block.count} copies
                      </span>
                    </div>
                    {block.codeBlock && (
                      <pre className="p-2.5 border border-zinc-900 bg-black/40 text-zinc-300 overflow-x-auto text-[10px] font-mono whitespace-pre max-h-[100px] max-w-full rounded-none">
                        <code>{block.codeBlock}</code>
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Traffic Context referrers and UTM */}
      {hasTrafficData && (
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-6">
          <h3 className="font-syne text-base font-bold text-white uppercase tracking-wider border-b border-[#262626]/40 pb-3">
            Traffic Attribution Context
          </h3>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Referrers */}
            <div className="space-y-3">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
                Top Referrer Channels
              </span>
              {metrics.traffic.referrers.length === 0 ? (
                <span className="font-mono text-xs text-zinc-600 italic">No referrers logged</span>
              ) : (
                <div className="border border-[#262626] bg-[#080808] font-mono text-xs divide-y divide-[#262626]/30 max-h-[220px] overflow-y-auto">
                  {metrics.traffic.referrers.map((ref) => {
                    const classification = classifyReferrer(ref.name);
                    const displayName = classification.label || ref.name;
                    return (
                      <div key={ref.name} className="px-4 py-2.5 flex justify-between items-center hover:bg-white/[0.01]">
                        <span className="text-zinc-300 truncate pr-4 flex items-center gap-2" title={ref.name}>
                          {getReferrerBrandIcon(classification.source)}
                          <span className="font-sans font-bold text-white">{displayName}</span>
                          {displayName.toLowerCase() !== ref.name.toLowerCase() && (
                            <span className="text-[10px] text-zinc-550 font-mono font-normal">({ref.name})</span>
                          )}
                        </span>
                        <span className="text-zinc-550 font-bold shrink-0">{ref.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* UTM Campaign statistics */}
            <div className="space-y-3">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
                UTM Campaign parameters
              </span>
              {metrics.traffic.utm.campaigns.length === 0 ? (
                <span className="font-mono text-xs text-zinc-600 italic">No UTM records found</span>
              ) : (
                <div className="border border-[#262626] bg-[#080808] font-mono text-xs divide-y divide-[#262626]/30 max-h-[220px] overflow-y-auto">
                  {metrics.traffic.utm.campaigns.map((utm) => (
                    <div key={utm.name} className="px-4 py-2.5 flex justify-between items-center hover:bg-white/[0.01]">
                      <span className="text-zinc-300 truncate pr-4 flex items-center gap-2" title={utm.name}>
                        <LuMegaphone className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                        <span className="font-sans font-bold text-white">{utm.name}</span>
                      </span>
                      <span className="text-zinc-550 font-bold shrink-0">{utm.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reader intent and Surveys Suggestions feedback list */}
      {config.endSurveyOn && (
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-6">
          <h3 className="font-syne text-base font-bold text-white uppercase tracking-wider border-b border-[#262626]/40 pb-3">
            Reader Intent & Survey Feedback
          </h3>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Difficulty rating segment */}
            {config.difficultyToggleOn && (
              <div className="md:col-span-1 space-y-4">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
                  Difficulty Rating Distribution
                </span>
                <div className="space-y-3 font-mono text-xs">
                  {[
                    { label: "Too Basic", val: metrics.survey.difficulty.too_basic, color: "bg-red-950/20 border border-red-500/10 text-zinc-400" },
                    { label: "Just Right", val: metrics.survey.difficulty.just_right, color: "bg-green/10 text-green" },
                    { label: "Too Advanced", val: metrics.survey.difficulty.too_advanced, color: "bg-red-950/20 border border-red-500/10 text-zinc-400" },
                  ].map((item) => {
                    const total = metrics.survey.difficulty.total;
                    const pct = total > 0 ? Math.round((item.val / total) * 100) : 0;
                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between items-center text-zinc-400 text-[11px]">
                          <span>{item.label}</span>
                          <span>{item.val} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-[#080808] border border-[#262626] rounded-none overflow-hidden">
                          <div className={`h-full ${item.color.includes("green") ? "bg-green" : "bg-zinc-700"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Free Text Suggestions comments */}
            <div className={`md:col-span-${config.difficultyToggleOn ? "2" : "3"} space-y-4`}>
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
                Free-text Suggestions ({totalSuggestions})
              </span>

              {totalSuggestions === 0 ? (
                <div className="p-8 text-center text-zinc-650 font-mono text-xs italic border border-[#262626] bg-[#080808]">
                  No suggestion responses received.
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {paginatedSuggestions.map((s) => (
                      <div
                        key={s.id}
                        className="border border-[#262626] bg-[#080808] p-4 space-y-2 rounded-none text-xs"
                      >
                        <div className="flex justify-between font-mono text-[9px] text-zinc-500 uppercase">
                          <span>
                            {s.difficulty ? s.difficulty.replace("_", " ") : "Difficulty: —"}
                          </span>
                          <span>{formatDate(s.createdAt)}</span>
                        </div>
                        <p className="text-zinc-250 leading-relaxed break-words">{s.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Pagination component */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-[#262626]/40 pt-4 font-mono text-xs">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1 border border-[#262626] hover:border-amber disabled:opacity-40 disabled:hover:border-[#262626] transition-colors rounded-none cursor-pointer"
                      >
                        ← PREV
                      </button>
                      <span className="text-zinc-500">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-3 py-1 border border-[#262626] hover:border-amber disabled:opacity-40 disabled:hover:border-[#262626] transition-colors rounded-none cursor-pointer"
                      >
                        NEXT →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notify Me Signups list */}
      {config.notifyMeOn && (
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none space-y-4">
          <div className="space-y-1 border-b border-[#262626]/40 pb-3">
            <h3 className="font-syne text-base font-bold text-white uppercase tracking-wider">
              Topic Notification follows
            </h3>
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              PII-Protected email lists registered to follow updates from this post
            </p>
          </div>

          {metrics.notify.length === 0 ? (
            <div className="p-8 text-center text-zinc-650 font-mono text-xs italic">
              No followers registered for this post.
            </div>
          ) : (
            <div className="border border-[#262626] bg-[#080808] overflow-x-auto min-w-0">
              <table className="w-full min-w-[500px] border-collapse font-mono text-[11px] text-left">
                <thead>
                  <tr className="border-b border-[#262626] bg-black/20 text-zinc-550 uppercase text-[9px] font-bold tracking-wider">
                    <th className="px-4 py-2">Follower Email (Masked)</th>
                    <th className="px-4 py-2">Requested Topic Details</th>
                    <th className="px-4 py-2 text-right">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]/30 text-zinc-300">
                  {metrics.notify.map((n) => (
                    <tr key={n.id} className="hover:bg-white/[0.01]">
                      <td className="px-4 py-2.5 text-zinc-200 select-all font-bold">
                        {n.email}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400 max-w-[200px] truncate" title={n.topic || ""}>
                        {n.topic || <span className="text-zinc-650">Any Updates</span>}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-500 text-right">
                        {formatDate(n.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
