import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { 
  LuChevronLeft, 
  LuGlobe, 
  LuCalendar
} from "react-icons/lu";
import {
  SiGoogle,
  SiReddit,
  SiWhatsapp,
  SiPinterest,
  SiYoutube,
  SiTiktok,
  SiMedium,
  SiDevdotto,
  SiStackoverflow,
  SiDuckduckgo,
  SiSubstack,
  SiPatreon,
  SiDribbble,
  SiBehance,
  SiFigma,
  SiSlack,
  SiDiscord,
  SiTelegram,
  SiProducthunt,
  SiYcombinator,
  SiWikipedia,
  SiThreads,
  SiQuora,
  SiMastodon,
  SiTumblr,
  SiVimeo,
  SiTwitch,
  SiPocket,
  SiFlipboard,
  SiFeedly,
  SiBlogger,
  SiWordpress,
  SiWechat,
  SiSinaweibo,
  SiLine
} from "react-icons/si";
import {
  FaLinkedin,
  FaTwitter,
  FaXTwitter,
  FaYahoo,
  FaInstagram,
  FaFacebook,
  FaGithub
} from "react-icons/fa6";
import ReferrerDetailClient from "./ReferrerDetailClient";

const REFERRER_ICONS: Record<string, { icon: any; color: string }> = {
  google: { icon: SiGoogle, color: "#4285F4" },
  linkedin: { icon: FaLinkedin, color: "#0A66C2" },
  instagram: { icon: FaInstagram, color: "#E1306C" },
  facebook: { icon: FaFacebook, color: "#1877F2" },
  github: { icon: FaGithub, color: "#FFFFFF" },
  twitter: { icon: FaTwitter, color: "#1DA1F2" },
  x: { icon: FaXTwitter, color: "#FFFFFF" },
  reddit: { icon: SiReddit, color: "#FF4500" },
  whatsapp: { icon: SiWhatsapp, color: "#25D366" },
  pinterest: { icon: SiPinterest, color: "#BD081C" },
  youtube: { icon: SiYoutube, color: "#FF0000" },
  tiktok: { icon: SiTiktok, color: "#FE2C55" },
  medium: { icon: SiMedium, color: "#00AB6C" },
  devto: { icon: SiDevdotto, color: "#FFFFFF" },
  stackoverflow: { icon: SiStackoverflow, color: "#F48024" },
  duckduckgo: { icon: SiDuckduckgo, color: "#DE5833" },
  yahoo: { icon: FaYahoo, color: "#6001D2" },
  bing: { icon: LuGlobe, color: "#00809D" },
  substack: { icon: SiSubstack, color: "#FF6719" },
  patreon: { icon: SiPatreon, color: "#FF424D" },
  dribbble: { icon: SiDribbble, color: "#EA4C89" },
  behance: { icon: SiBehance, color: "#1769FF" },
  figma: { icon: SiFigma, color: "#F24E1E" },
  slack: { icon: SiSlack, color: "#4A154B" },
  discord: { icon: SiDiscord, color: "#5865F2" },
  telegram: { icon: SiTelegram, color: "#26A5E4" },
  producthunt: { icon: SiProducthunt, color: "#DA552F" },
  hackernews: { icon: SiYcombinator, color: "#FF6600" },
  ycombinator: { icon: SiYcombinator, color: "#FF6600" },
  wikipedia: { icon: SiWikipedia, color: "#FFFFFF" },
  threads: { icon: SiThreads, color: "#FFFFFF" },
  quora: { icon: SiQuora, color: "#B92B27" },
  mastodon: { icon: SiMastodon, color: "#563ACC" },
  tumblr: { icon: SiTumblr, color: "#36465D" },
  vimeo: { icon: SiVimeo, color: "#1AB7EA" },
  twitch: { icon: SiTwitch, color: "#9146FF" },
  pocket: { icon: SiPocket, color: "#EF4056" },
  flipboard: { icon: SiFlipboard, color: "#E12828" },
  feedly: { icon: SiFeedly, color: "#2BB24C" },
  blogger: { icon: SiBlogger, color: "#FC4F08" },
  wordpress: { icon: SiWordpress, color: "#21759B" },
  wechat: { icon: SiWechat, color: "#07C160" },
  weibo: { icon: SiSinaweibo, color: "#E6162D" },
  line: { icon: SiLine, color: "#06C755" },
};

function getLargeReferrerIcon(name: string) {
  const key = name.toLowerCase().replace(/\s+/g, "");
  const match = REFERRER_ICONS[key];
  if (match) {
    const Icon = match.icon;
    return <Icon className="w-10 h-10" style={{ color: match.color }} />;
  }
  return <LuGlobe className="w-10 h-10 text-zinc-500" />;
}

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function ReferrerDetailPage({ params }: PageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  // Fetch page views attributed to this traffic source
  const pageViews = await prisma.pageView.findMany({
    where: {
      trafficSource: decodedName.toLowerCase(),
    },
    include: {
      visitor: true,
    },
    orderBy: {
      timestamp: "desc",
    },
  });

  if (pageViews.length === 0) {
    notFound();
  }

  // De-duplicate unique visitors who used this referrer
  const visitorsMap = new Map<string, typeof pageViews[0]["visitor"] & { pageViewsCount: number }>();
  pageViews.forEach((pv) => {
    const v = pv.visitor;
    const existing = visitorsMap.get(v.id) || { ...v, pageViewsCount: 0 };
    existing.pageViewsCount++;
    visitorsMap.set(v.id, existing);
  });

  const uniqueVisitors = Array.from(visitorsMap.values());

  // Date formatting helpers
  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const firstSeen = pageViews[pageViews.length - 1]?.timestamp || new Date();
  const lastSeen = pageViews[0]?.timestamp || new Date();

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
          Source Key: {decodedName.toLowerCase()}
        </span>
      </div>

      {/* REFERRER BANNER PROFILE */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 mb-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/[0.02] border border-zinc-800 flex items-center justify-center">
            {getLargeReferrerIcon(decodedName)}
          </div>
          <div>
            <h1 className="font-syne text-2xl font-bold text-white tracking-tight">{decodedName}</h1>
            <p className="text-xs text-zinc-500 font-mono uppercase mt-1">
              Traffic Medium: {pageViews[0]?.utmMedium || "social / referral"}
            </p>
          </div>
        </div>
        
        {/* Quick aggregates */}
        <div className="grid grid-cols-2 gap-4 md:flex md:gap-8 font-mono text-xs">
          <div className="border-l border-zinc-800 pl-4 py-1">
            <span className="text-zinc-500 block uppercase mb-1">TOTAL VIEWS</span>
            <span className="text-lg font-bold text-white">{pageViews.length}</span>
          </div>
          <div className="border-l border-zinc-800 pl-4 py-1">
            <span className="text-zinc-500 block uppercase mb-1">UNIQUE VISITORS</span>
            <span className="text-lg font-bold text-emerald-400">{uniqueVisitors.length}</span>
          </div>
          <div className="border-l border-zinc-800 pl-4 py-1 col-span-2 md:col-span-1">
            <span className="text-zinc-500 block uppercase mb-1 flex items-center gap-1">
              <LuCalendar className="w-3 h-3 text-zinc-500" /> FIRST DETECTED
            </span>
            <span className="text-zinc-300">{formatDateTime(firstSeen)}</span>
          </div>
          <div className="border-l border-zinc-800 pl-4 py-1 col-span-2 md:col-span-1">
            <span className="text-zinc-500 block uppercase mb-1 flex items-center gap-1">
              <LuCalendar className="w-3 h-3 text-zinc-500" /> LAST DETECTED
            </span>
            <span className="text-zinc-300">{formatDateTime(lastSeen)}</span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE DATA CLIENT COMPONENT */}
      <ReferrerDetailClient
        initialVisitors={uniqueVisitors.map((v) => ({
          id: v.id,
          city: v.city,
          country: v.country,
          device: v.device,
          browser: v.browser,
          pageViewsCount: v.pageViewsCount,
        }))}
        initialPageViews={pageViews.map((pv) => ({
          id: pv.id,
          path: pv.path,
          referrer: pv.referrer,
          timestamp: pv.timestamp.toISOString(),
        }))}
      />
    </div>
  );
}
