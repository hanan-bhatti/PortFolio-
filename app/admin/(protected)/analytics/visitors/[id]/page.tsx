import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { 
  LuChevronLeft, 
  LuLaptop, 
  LuSmartphone, 
  LuTablet, 
  LuShieldCheck, 
  LuGlobe, 
  LuCalendar, 
  LuClock, 
  LuEye, 
  LuMessageSquare, 
  LuFlame, 
  LuStar 
} from "react-icons/lu";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VisitorDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch visitor and direct relations
  const visitor = await prisma.visitor.findUnique({
    where: { id },
    include: {
      pageViews: {
        orderBy: { timestamp: "desc" },
      },
      formSubmissions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!visitor) {
    notFound();
  }

  // Fetch unlinked tracking data by visitorId
  const [
    emojiReactions,
    sectionReactions,
    helpfulVotes,
    starRatings,
    endSurveyResponses,
    analyticsEvents,
  ] = await Promise.all([
    prisma.postEmojiReaction.findMany({
      where: { visitorId: id },
      include: { post: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.postSectionReaction.findMany({
      where: { visitorId: id },
      include: { post: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.postHelpfulVote.findMany({
      where: { visitorId: id },
      include: { post: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.postStarRating.findMany({
      where: { visitorId: id },
      include: { post: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.postEndSurveyResponse.findMany({
      where: { visitorId: id },
      include: { post: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.postAnalyticsEvent.findMany({
      where: { visitorId: id },
      include: { post: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Calculate total active time spent reading (max time_on_page per post)
  const timeEvents = analyticsEvents.filter((e) => e.eventType === "time_on_page" && e.value);
  const timePerPost: Record<string, { title: string; duration: number }> = {};
  timeEvents.forEach((e) => {
    const val = parseFloat(e.value!);
    const currentMax = timePerPost[e.postId]?.duration ?? 0;
    if (val > currentMax) {
      timePerPost[e.postId] = {
        title: e.post?.title || "Unknown Post",
        duration: val,
      };
    }
  });

  const totalTimeSpent = Object.values(timePerPost).reduce((sum, item) => sum + item.duration, 0);

  // Format functions
  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
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
        return <LuSmartphone className="w-4 h-4 text-emerald-400" />;
      case "tablet":
        return <LuTablet className="w-4 h-4 text-amber-400" />;
      default:
        return <LuLaptop className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090909] p-6 lg:p-8 font-sans text-zinc-300">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/admin/analytics"
          className="flex items-center gap-2 text-sm font-mono text-zinc-400 transition hover:text-white"
        >
          <LuChevronLeft className="w-4 h-4" /> BACK TO DASHBOARD
        </Link>
        <span className="text-xs font-mono bg-zinc-800 text-zinc-400 border border-zinc-700 px-2.5 py-1">
          ID: {visitor.id}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN: Profile summary card */}
        <div className="space-y-6 lg:col-span-1">
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none">
            <h2 className="mb-4 font-syne text-lg font-bold text-white tracking-tight">Visitor Profile</h2>
            <div className="space-y-4">
              {/* Location */}
              <div className="flex items-center justify-between py-2 border-b border-[#262626]/50">
                <span className="text-zinc-500 font-mono text-xs uppercase flex items-center gap-1.5">
                  <LuGlobe className="w-3.5 h-3.5" /> Location
                </span>
                <span className="text-white font-medium text-sm">
                  {visitor.city && visitor.country
                    ? `${visitor.city}, ${visitor.country}`
                    : visitor.country || "Unknown Country"}
                </span>
              </div>

              {/* Device */}
              <div className="flex items-center justify-between py-2 border-b border-[#262626]/50">
                <span className="text-zinc-500 font-mono text-xs uppercase flex items-center gap-1.5">
                  Device Configuration
                </span>
                <div className="flex items-center gap-2 text-white text-sm capitalize">
                  {getDeviceIcon(visitor.device)}
                  {visitor.device || "desktop"}
                </div>
              </div>

              {/* Browser / OS */}
              <div className="flex items-center justify-between py-2 border-b border-[#262626]/50">
                <span className="text-zinc-500 font-mono text-xs uppercase">Platform / Browser</span>
                <span className="text-white text-sm">
                  {visitor.browser || "Unknown"} ({visitor.os || "Unknown OS"})
                </span>
              </div>

              {/* First Seen */}
              <div className="flex items-center justify-between py-2 border-b border-[#262626]/50">
                <span className="text-zinc-500 font-mono text-xs uppercase flex items-center gap-1.5">
                  <LuCalendar className="w-3.5 h-3.5" /> First Visit
                </span>
                <span className="text-zinc-400 font-mono text-xs">
                  {formatDateTime(visitor.firstSeen)}
                </span>
              </div>

              {/* Last Seen */}
              <div className="flex items-center justify-between py-2 border-b border-[#262626]/50">
                <span className="text-zinc-500 font-mono text-xs uppercase flex items-center gap-1.5">
                  <LuCalendar className="w-3.5 h-3.5" /> Last Activity
                </span>
                <span className="text-zinc-400 font-mono text-xs">
                  {formatDateTime(visitor.lastSeen)}
                </span>
              </div>

              {/* Visits / Pages */}
              <div className="flex items-center justify-between py-2 border-b border-[#262626]/50">
                <span className="text-zinc-500 font-mono text-xs uppercase">Total Visits</span>
                <span className="text-white font-mono font-semibold">{visitor.visits} sessions</span>
              </div>

              {/* Total Time */}
              <div className="flex items-center justify-between py-2 border-b border-[#262626]/50">
                <span className="text-zinc-500 font-mono text-xs uppercase flex items-center gap-1.5">
                  <LuClock className="w-3.5 h-3.5" /> Active Read Time
                </span>
                <span className="text-emerald-400 font-mono font-semibold">
                  {totalTimeSpent > 60 
                    ? `${Math.floor(totalTimeSpent / 60)}m ${Math.round(totalTimeSpent % 60)}s` 
                    : `${Math.round(totalTimeSpent)}s`}
                </span>
              </div>

              {/* Consent Type */}
              <div className="flex items-center justify-between py-2">
                <span className="text-zinc-500 font-mono text-xs uppercase flex items-center gap-1.5">
                  <LuShieldCheck className="w-3.5 h-3.5" /> Privacy Consent
                </span>
                <span className={`px-2 py-0.5 font-mono text-[10px] font-semibold ${
                  visitor.consentType === "all"
                    ? "bg-green-950 text-emerald-400 border border-emerald-900"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}>
                  {visitor.consentType}
                </span>
              </div>
            </div>
          </div>

          {/* Time spent per post breakdown */}
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none">
            <h3 className="mb-4 font-syne text-md font-bold text-white tracking-tight">Time Spent Reading</h3>
            <div className="space-y-3">
              {Object.entries(timePerPost).map(([postId, post]) => (
                <div key={postId} className="flex flex-col gap-1 py-2 border-b border-[#262626]/30 last:border-0">
                  <span className="text-zinc-300 text-xs font-medium truncate max-w-full" title={post.title}>
                    {post.title}
                  </span>
                  <div className="flex justify-between items-center text-[11px] text-zinc-500 font-mono">
                    <span>Active duration</span>
                    <span className="text-zinc-300 font-semibold">
                      {post.duration > 60 
                        ? `${Math.floor(post.duration / 60)}m ${Math.round(post.duration % 60)}s` 
                        : `${Math.round(post.duration)}s`}
                    </span>
                  </div>
                </div>
              ))}
              {Object.keys(timePerPost).length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-2">No active read times recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Timelines */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section 1: Contact Submissions */}
          {visitor.formSubmissions.length > 0 && (
            <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none">
              <h2 className="mb-4 font-syne text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <LuMessageSquare className="w-5 h-5 text-emerald-400" /> Contact Inquiries
              </h2>
              <div className="space-y-4">
                {visitor.formSubmissions.map((sub) => (
                  <div key={sub.id} className="border border-[#222] bg-white/[0.01] p-4 rounded-none space-y-2">
                    <div className="flex justify-between text-xs text-zinc-500 font-mono border-b border-zinc-800 pb-2">
                      <span>Sender: {sub.name} ({sub.email})</span>
                      <span>{formatDateTime(sub.createdAt)}</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white mb-1">Subject: {sub.subject}</div>
                      <p className="text-zinc-400 text-xs leading-relaxed whitespace-pre-wrap">{sub.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Engagement Timeline */}
          <div data-tour="visitor-journey-timeline" className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none">
            <h2 className="mb-4 font-syne text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <LuFlame className="w-5 h-5 text-amber-500" /> User Interaction Timeline
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin pr-2">
              {/* Combine stars, survey, emojis, helpful votes */}
              {[
                ...helpfulVotes.map(v => ({
                  type: "vote",
                  title: `Voted post "${v.post.title}" as ${v.helpful ? "HELPFUL 👍" : "NOT HELPFUL 👎"}`,
                  date: v.createdAt,
                  icon: <LuStar className="w-3.5 h-3.5 text-blue-400" />
                })),
                ...starRatings.map(s => ({
                  type: "rating",
                  title: `Rated post "${s.post.title}": ${s.rating} Stars`,
                  date: s.createdAt,
                  icon: <LuStar className="w-3.5 h-3.5 text-amber-400" />
                })),
                ...emojiReactions.map(er => ({
                  type: "emoji",
                  title: `Reacted with emoji ${er.emoji} to post "${er.post.title}"`,
                  date: er.createdAt,
                  icon: <LuFlame className="w-3.5 h-3.5 text-rose-400" />
                })),
                ...sectionReactions.map(sr => ({
                  type: "section-emoji",
                  title: `Reacted with emoji ${sr.emoji} in section "${sr.sectionId}" of "${sr.post.title}"`,
                  date: sr.createdAt,
                  icon: <LuFlame className="w-3.5 h-3.5 text-orange-400" />
                })),
                ...endSurveyResponses.map(es => ({
                  type: "survey",
                  title: `Answered End Survey on "${es.post.title}" (Difficulty: ${es.difficulty || "—"}, Suggestions: "${es.responseText || "—"}")`,
                  date: es.createdAt,
                  icon: <LuMessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                })),
                ...analyticsEvents
                  .filter((e) => e.eventType === "scroll_depth")
                  .map((e) => ({
                    type: "scroll",
                    title: `Scrolled post "${e.post?.title || "Unknown"}" to ${e.value}% depth`,
                    date: e.createdAt,
                    icon: <LuEye className="w-3.5 h-3.5 text-zinc-500" />
                  }))
              ]
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .map((event, idx) => (
                  <div key={idx} className="flex gap-3 py-2 border-b border-zinc-800/40 last:border-0 items-start">
                    <div className="mt-0.5">{event.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-300 text-xs font-medium leading-normal">{event.title}</p>
                      <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">{formatDateTime(event.date)}</span>
                    </div>
                  </div>
                ))}
              {[
                ...helpfulVotes,
                ...starRatings,
                ...emojiReactions,
                ...sectionReactions,
                ...endSurveyResponses,
                ...analyticsEvents.filter((e) => e.eventType === "scroll_depth")
              ].length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-4">No interaction timeline recorded.</p>
              )}
            </div>
          </div>

          {/* Section 3: Detailed Page Visits Timeline */}
          <div className="border border-[#262626] bg-[#0c0c0c] p-6 rounded-none">
            <h2 className="mb-4 font-syne text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <LuEye className="w-5 h-5 text-sky-400" /> Navigation & Page Views
            </h2>
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-[#262626] text-zinc-500 font-mono text-[10px] uppercase">
                    <th className="pb-3 font-medium">Path</th>
                    <th className="pb-3 font-medium">Traffic Source / Referrer</th>
                    <th className="pb-3 font-medium text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]/30">
                  {visitor.pageViews.map((pv) => (
                    <tr key={pv.id} className="hover:bg-white/[0.01]">
                      <td className="py-3 font-medium text-zinc-200 font-mono truncate max-w-[200px]" title={pv.path}>
                        {pv.path}
                      </td>
                      <td className="py-3 text-zinc-400">
                        <div className="flex flex-col">
                          <span className="text-zinc-300 text-xs font-semibold capitalize">{pv.trafficSource}</span>
                          {pv.referrer && (
                            <span className="text-[10px] text-zinc-500 truncate max-w-[240px]" title={pv.referrer}>
                              {pv.referrer}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right text-zinc-500 font-mono text-[11px]">
                        {formatDateTime(pv.timestamp)}
                      </td>
                    </tr>
                  ))}
                  {visitor.pageViews.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-zinc-600">No page views tracked yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
