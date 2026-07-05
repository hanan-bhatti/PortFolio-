import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { FiMail, FiCalendar, FiUsers, FiActivity, FiClock, FiEye, FiSmartphone, FiMonitor, FiTablet } from "react-icons/fi";
import { FaChrome, FaSafari, FaFirefox, FaInstagram, FaLinkedin, FaFacebook, FaTwitter } from "react-icons/fa6";
import { UAParser } from "ua-parser-js";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local[0]}${local.slice(1, -1).replace(/./g, "*")}${local[local.length - 1]}@${domain}`;
}

function getDeviceIcon(device: string) {
  const dev = device.toLowerCase();
  if (dev.includes("mobile") || dev.includes("phone")) {
    return <FiSmartphone className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />;
  }
  if (dev.includes("tablet") || dev.includes("ipad")) {
    return <FiTablet className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />;
  }
  return <FiMonitor className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />;
}

function getBrowserIcon(browser: string) {
  const b = browser.toLowerCase();
  if (b.includes("instagram")) {
    return <FaInstagram className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />;
  }
  if (b.includes("linkedin")) {
    return <FaLinkedin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" style={{ color: "#0A66C2" }} />;
  }
  if (b.includes("facebook")) {
    return <FaFacebook className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />;
  }
  if (b.includes("twitter") || b.includes("x")) {
    return <FaTwitter className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />;
  }
  if (b.includes("chrome")) {
    return <FaChrome className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />;
  }
  if (b.includes("safari")) {
    return <FaSafari className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
  }
  if (b.includes("firefox")) {
    return <FaFirefox className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />;
  }
  return null;
}

export default async function CampaignDetailPage({ params }: Props) {
  const { id } = await params;

  const campaign = await prisma.emailCampaign.findUnique({
    where: { id },
    include: {
      post: { select: { id: true, title: true } },
      opens: { orderBy: { openedAt: "desc" } },
    },
  });

  if (!campaign) {
    notFound();
  }

  // Fetch campaign clicks
  const shortLink = await prisma.shortLink.findFirst({
    where: {
      targetUrl: {
        contains: id,
      },
    },
    include: {
      clicks: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const clicks = shortLink ? shortLink.clicks : [];
  const openRate = campaign.sentCount > 0 ? Math.round((campaign.opens.length / campaign.sentCount) * 100) : 0;
  const clickRate = campaign.sentCount > 0 ? Math.round((clicks.length / campaign.sentCount) * 100) : 0;

  return (
    <div className="space-y-8 font-mono text-xs text-zinc-300 pb-12">
      <div className="flex items-center gap-2">
        <Link href="/admin/newsletter" className="text-zinc-500 hover:text-white transition-colors">
          &larr; Back to Newsletter Manager
        </Link>
      </div>

      <PageHeader
        title="Campaign Detailed Metrics"
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Newsletter", href: "/admin/newsletter" },
          { label: "Campaign" },
        ]}
      />

      <div className="border border-[#262626] bg-[#0c0c0c] p-4 text-white font-bold text-[13px] uppercase tracking-wide">
        Subject: &ldquo;{campaign.subject}&rdquo;
      </div>

      {/* Grid Stats */}
      <div data-tour="campaign-metrics-row" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="border border-[#262626] bg-[#0c0c0c] p-5">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="uppercase text-[9px] font-bold tracking-wider">Receivers</span>
            <FiUsers className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{campaign.sentCount}</p>
        </div>

        <div className="border border-[#262626] bg-[#0c0c0c] p-5">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="uppercase text-[9px] font-bold tracking-wider">Total Opens</span>
            <FiActivity className="h-4 w-4 text-green" />
          </div>
          <p className="mt-2 text-2xl font-bold text-green">{campaign.opens.length}</p>
        </div>

        <div className="border border-[#262626] bg-[#0c0c0c] p-5">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="uppercase text-[9px] font-bold tracking-wider">Open Rate</span>
            <FiEye className="h-4 w-4 text-green" />
          </div>
          <p className="mt-2 text-2xl font-bold text-green">{openRate}%</p>
        </div>

        <div className="border border-[#262626] bg-[#0c0c0c] p-5">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="uppercase text-[9px] font-bold tracking-wider">Link Clicks</span>
            <FiClock className="h-4 w-4 text-amber" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber">{clicks.length}</p>
        </div>

        <div className="border border-[#262626] bg-[#0c0c0c] p-5">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="uppercase text-[9px] font-bold tracking-wider">Click Rate</span>
            <FiMail className="h-4 w-4 text-amber" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber">{clickRate}%</p>
        </div>
      </div>

      {/* Info Details */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-3">
        <h3 className="font-syne text-sm font-bold text-white uppercase tracking-wider border-b border-[#262626]/40 pb-2">
          Campaign Description
        </h3>
        <div className="grid gap-4 md:grid-cols-2 text-zinc-400">
          <div>
            <span className="text-zinc-550">Target Post:</span>{" "}
            <Link href={`/admin/posts/${campaign.postId}/engagement`} className="text-white hover:underline">
              {campaign.post.title}
            </Link>
          </div>
          <div>
            <span className="text-zinc-550">Date Sent:</span>{" "}
            <span className="text-white">{new Date(campaign.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Double Column Logs */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email Opens Table */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-4">
          <h3 className="font-syne text-sm font-bold text-white uppercase tracking-wider border-b border-[#262626]/40 pb-2 flex items-center gap-2">
            <FiEye className="text-green w-4 h-4" /> Email Opens Log ({campaign.opens.length})
          </h3>
          <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#262626] text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="pb-2">Subscriber</th>
                  <th className="pb-2">Time Opened</th>
                  <th className="pb-2">Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {campaign.opens.map((op) => {
                  const ua = op.userAgent ? new UAParser(op.userAgent).getResult() : null;
                  const browserName = ua?.browser.name || "Unknown Browser";
                  const deviceType = ua?.device.type || "desktop";
                  return (
                    <tr key={op.id} className="hover:bg-white/[0.01]">
                      <td className="py-2 font-bold text-white">{maskEmail(op.email)}</td>
                      <td className="py-2 text-zinc-400">{new Date(op.openedAt).toLocaleString()}</td>
                      <td className="py-2 flex items-center gap-1.5 capitalize text-zinc-550">
                        {getDeviceIcon(deviceType)}
                        {getBrowserIcon(browserName)}
                        <span>{browserName}</span>
                      </td>
                    </tr>
                  );
                })}
                {campaign.opens.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-zinc-550 uppercase italic">
                      No opens logged yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Link Clicks Table */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-4">
          <h3 className="font-syne text-sm font-bold text-white uppercase tracking-wider border-b border-[#262626]/40 pb-2 flex items-center gap-2">
            <FiClock className="text-amber w-4 h-4" /> Link Clickthroughs Log ({clicks.length})
          </h3>
          <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#262626] text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="pb-2">Time Clicked</th>
                  <th className="pb-2">Referer</th>
                  <th className="pb-2">Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {clicks.map((cl) => {
                  const ua = cl.userAgent ? new UAParser(cl.userAgent).getResult() : null;
                  const browserName = ua?.browser.name || "Unknown Browser";
                  const deviceType = ua?.device.type || "desktop";
                  return (
                    <tr key={cl.id} className="hover:bg-white/[0.01]">
                      <td className="py-2 font-bold text-white">{new Date(cl.createdAt).toLocaleString()}</td>
                      <td className="py-2 text-zinc-400 truncate max-w-[120px]" title={cl.referer || "Direct"}>
                        {cl.referer || "Direct"}
                      </td>
                      <td className="py-2 flex items-center gap-1.5 capitalize text-zinc-550">
                        {getDeviceIcon(deviceType)}
                        {getBrowserIcon(browserName)}
                        <span>{browserName}</span>
                      </td>
                    </tr>
                  );
                })}
                {clicks.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-zinc-550 uppercase italic">
                      No link clickthroughs logged yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
