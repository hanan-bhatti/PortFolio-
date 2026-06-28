import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import { FiMail, FiCalendar, FiActivity, FiEye, FiClock, FiSmartphone, FiMonitor, FiTablet } from "react-icons/fi";
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

export default async function SubscriberDetailPage({ params }: Props) {
  const { id } = await params;

  const subscriber = await prisma.postNotifyRequest.findUnique({
    where: { id },
    include: {
      post: { select: { title: true } },
    },
  });

  if (!subscriber) {
    notFound();
  }

  // Fetch campaign email opens for this email address
  const opens = await prisma.emailOpen.findMany({
    where: {
      email: subscriber.email,
    },
    include: {
      campaign: {
        select: {
          id: true,
          subject: true,
        },
      },
    },
    orderBy: {
      openedAt: "desc",
    },
  });

  return (
    <div className="space-y-8 font-mono text-xs text-zinc-300 pb-12">
      <div className="flex items-center gap-2">
        <Link href="/admin/newsletter" className="text-zinc-500 hover:text-white transition-colors">
          &larr; Back to Newsletter Manager
        </Link>
      </div>

      <PageHeader
        title="Subscriber Detail"
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Newsletter", href: "/admin/newsletter" },
          { label: "Subscriber" },
        ]}
      />

      <div className="border border-[#262626] bg-[#0c0c0c] p-4 text-white font-bold text-[13px] uppercase tracking-wide">
        Subscriber ID: {subscriber.id}
      </div>

      {/* Info Details Card */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-6">
        <h3 className="font-syne text-sm font-bold text-white uppercase tracking-wider border-b border-[#262626]/40 pb-2">
          Subscriber Information
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <span className="text-zinc-550 block mb-1 uppercase tracking-widest text-[9px]">Email Address</span>
              <span className="text-sm font-bold text-white">{maskEmail(subscriber.email)}</span>
            </div>
            <div>
              <span className="text-zinc-550 block mb-1 uppercase tracking-widest text-[9px]">Status</span>
              <span className={`px-1.5 py-0.5 border text-[9px] uppercase font-bold inline-block ${
                subscriber.confirmed 
                  ? "border-green/20 bg-green/5 text-green" 
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-500"
              }`}>
                {subscriber.confirmed ? "Active / Confirmed" : "Pending Confirmation"}
              </span>
            </div>
            <div>
              <span className="text-zinc-550 block mb-1 uppercase tracking-widest text-[9px]">Subscribed On</span>
              <span className="text-white text-xs">{new Date(subscriber.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-zinc-550 block mb-1 uppercase tracking-widest text-[9px]">Signup Source / Post Context</span>
              <span className="text-white text-xs">
                {subscriber.post ? (
                  <span>Signed up while reading: <span className="font-bold">{subscriber.post.title}</span></span>
                ) : (
                  "Signed up from global newsletter footer context"
                )}
              </span>
            </div>
            <div>
              <span className="text-zinc-550 block mb-1 uppercase tracking-widest text-[9px]">Interests / Requested Topics</span>
              <span className="text-zinc-400 italic block border border-[#262626] bg-black p-3.5 text-xs text-white">
                {subscriber.topic && subscriber.topic.trim() !== "" 
                  ? `"${subscriber.topic}"` 
                  : "No custom interest topic provided at signup."}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Email Opens Log */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 space-y-4">
        <h3 className="font-syne text-sm font-bold text-white uppercase tracking-wider border-b border-[#262626]/40 pb-2 flex items-center gap-2">
          <FiEye className="text-green w-4 h-4" /> Campaign Email Opens History ({opens.length})
        </h3>
        <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#262626] text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                <th className="pb-2">Campaign Subject</th>
                <th className="pb-2">Time Opened</th>
                <th className="pb-2">Agent Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {opens.map((op) => {
                const ua = op.userAgent ? new UAParser(op.userAgent).getResult() : null;
                const browserName = ua?.browser.name || "Unknown Browser";
                const deviceType = ua?.device.type || "desktop";
                return (
                  <tr key={op.id} className="hover:bg-white/[0.01]">
                    <td className="py-2.5 font-bold text-white">
                      <Link href={`/admin/newsletter/campaigns/${op.campaignId}`} className="hover:underline hover:text-amber">
                        {op.campaign.subject}
                      </Link>
                    </td>
                    <td className="py-2.5 text-zinc-400">{new Date(op.openedAt).toLocaleString()}</td>
                    <td className="py-2.5 flex items-center gap-1.5 capitalize text-zinc-550">
                      {getDeviceIcon(deviceType)}
                      {getBrowserIcon(browserName)}
                      <span>{browserName}</span>
                    </td>
                  </tr>
                );
              })}
              {opens.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-zinc-555 uppercase font-mono italic">
                    No campaigns opened by this subscriber yet
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
