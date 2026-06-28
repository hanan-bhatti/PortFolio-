/**
 * @file app/admin/(protected)/analytics/clicks/shortlinks/[code]/page.tsx
 * @description Admin page for analyzing click statistics of a specific tracked short link.
 */

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UAParser } from "ua-parser-js";
import ShortLinkDetailClient from "./ShortLinkDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function ShortLinkDetailPage({ params }: Props) {
  const { code } = await params;

  const shortLink = await prisma.shortLink.findUnique({
    where: { code },
    include: {
      clicks: {
        include: {
          visitor: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!shortLink) {
    notFound();
  }

  // Formatting targetDisplay clean label
  let sourceLabel = "";
  let baseTargetUrl = shortLink.targetUrl;
  try {
    const url = new URL(shortLink.targetUrl);
    const utmSource = url.searchParams.get("utm_source");
    const utmMedium = url.searchParams.get("utm_medium");
    const chosenLabel = utmMedium || utmSource;
    if (chosenLabel) {
      sourceLabel = ` (${chosenLabel.charAt(0).toUpperCase() + chosenLabel.slice(1)})`;
    }
    if (url.protocol === "mailto:") {
      baseTargetUrl = `mailto:${url.pathname}`;
    } else {
      baseTargetUrl = url.origin + url.pathname;
    }
  } catch {
    if (shortLink.targetUrl.includes("utm_medium=") || shortLink.targetUrl.includes("utm_source=")) {
      const matchMedium = shortLink.targetUrl.match(/utm_medium=([^&]+)/);
      const matchSource = shortLink.targetUrl.match(/utm_source=([^&]+)/);
      const match = matchMedium || matchSource;
      if (match && match[1]) {
        sourceLabel = ` (${match[1].charAt(0).toUpperCase() + match[1].slice(1)})`;
      }
      baseTargetUrl = shortLink.targetUrl.split("?")[0] || shortLink.targetUrl;
    }
  }

  const targetDisplay = baseTargetUrl.includes("github.com")
    ? `GitHub Profile${sourceLabel}`
    : baseTargetUrl.includes("linkedin.com")
    ? `LinkedIn Profile${sourceLabel}`
    : baseTargetUrl.includes("twitter.com") || baseTargetUrl.includes("x.com")
    ? `Twitter / X Profile${sourceLabel}`
    : baseTargetUrl.includes("mailto:")
    ? `Email Link (${(baseTargetUrl.replace("mailto:", "").split("?")[0]) || ""})${sourceLabel}`
    : `${baseTargetUrl}${sourceLabel}`;

  const shortLinkMeta = {
    id: shortLink.id,
    code: shortLink.code,
    targetUrl: shortLink.targetUrl,
    type: shortLink.type,
    targetDisplay,
    clicksCount: shortLink.clicks.length,
  };

  // Generate 7 days timeline
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  }).reverse();

  const timelineData = last7Days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const clicksCount = shortLink.clicks.filter((click) => {
      const time = click.createdAt.getTime();
      return time >= day.getTime() && time < nextDay.getTime();
    }).length;

    return {
      label: day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      clicks: clicksCount,
    };
  });

  // Distributions logic
  const deviceCounts: Record<string, number> = {};
  const browserCounts: Record<string, number> = {};
  const osCounts: Record<string, number> = {};

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

  shortLink.clicks.forEach((click) => {
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

  const getDistribution = (counts: Record<string, number>) =>
    Object.entries(counts)
      .map(([label, count]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        count,
      }))
      .sort((a, b) => b.count - a.count);

  const clicksLogs = shortLink.clicks.map((click) => {
    let location = "Unknown";
    let device = "desktop";
    let browser = "Unknown";
    let os = "Unknown";

    if (click.visitor) {
      const parts = [];
      if (click.visitor.city) parts.push(click.visitor.city);
      if (click.visitor.country) parts.push(click.visitor.country);
      location = parts.length > 0 ? parts.join(", ") : "Unknown";
      device = click.visitor.device || "desktop";
      browser = click.visitor.browser || "Unknown";
      os = click.visitor.os || "Unknown";
    } else if (click.userAgent) {
      const parser = new UAParser(click.userAgent);
      device = parser.getDevice().type || "desktop";
      os = parser.getOS().name || "Unknown";
      browser = parser.getBrowser().name || "Unknown";
    }

    return {
      id: click.id,
      visitorId: click.visitorId,
      location,
      device,
      browser,
      os,
      referer: click.referer || "direct",
      timestamp: click.createdAt.toISOString(),
    };
  });

  return (
    <div className="p-6">
      <ShortLinkDetailClient
        shortLink={shortLinkMeta}
        clicks={clicksLogs}
        timelineData={timelineData}
        devices={getDistribution(deviceCounts)}
        browsers={getDistribution(browserCounts)}
        oss={getDistribution(osCounts)}
      />
    </div>
  );
}
