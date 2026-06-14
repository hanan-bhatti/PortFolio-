/**
 * @file app/api/analytics/identify/route.ts
 * @description Next.js API route handling requests for the route.ts endpoint.
 * 
 * @exports
 * - POST(): Function
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

const fetchWithTimeout = (url: string, ms = 2000): Promise<Response> => {
  return Promise.race([
    fetch(url),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms)),
  ]);
};

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip")?.trim() ||
      "127.0.0.1";

    const userAgent = request.headers.get("user-agent") || "";
    console.log("UA:", userAgent);

    // Check if site-wide analytics is enabled
    const settings = await prisma.siteSettings.findMany({
      where: { key: "analytics_enabled" },
    });
    const analyticsEnabledSetting = settings[0]?.value ?? "true";
    if (analyticsEnabledSetting === "false") {
      return NextResponse.json({ error: "Analytics disabled" }, { status: 403 });
    }

    // Create fingerprint — never store raw IP
    const salt = process.env.FINGERPRINT_SALT || "default-salt-value";
    const fingerprint = createHash("sha256")
      .update(ip + userAgent + salt)
      .digest("hex");

    // Read cookie consent
    const consentCookie = request.cookies.get("cookie_consent")?.value;
    const consentType = consentCookie === "all" ? "all" : "essential";

    let geo: { country?: string; city?: string } = {};

    // Only geolocate and parse user-agent if analytics consent is "all"
    if (consentType === "all" && ip !== "127.0.0.1" && ip !== "localhost" && ip !== "::1") {
      try {
        const geoRes = await fetchWithTimeout(`http://ip-api.com/json/${ip}?fields=country,city`, 2000);
        if (geoRes.ok) {
          geo = await geoRes.json();
        }
      } catch (e) {
        // fail silently
      }
    }

    let device: string | null = null;
    let browser: string | null = null;
    let os: string | null = null;

    if (consentType === "all") {
      const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
      const isTablet = /ipad|tablet/i.test(userAgent);
      device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

      browser =
        /edg\//i.test(userAgent) ? "Edge" :
        /opr\//i.test(userAgent) ? "Opera" :
        /chrome/i.test(userAgent) ? "Chrome" :
        /firefox/i.test(userAgent) ? "Firefox" :
        /safari/i.test(userAgent) ? "Safari" : "Other";

      os =
        /windows nt/i.test(userAgent) ? "Windows" :
        /mac os x/i.test(userAgent) ? "macOS" :
        /linux/i.test(userAgent) ? "Linux" :
        /android/i.test(userAgent) ? "Android" :
        /iphone|ipad/i.test(userAgent) ? "iOS" : "Other";
    }

    // Upsert visitor
    const visitor = await prisma.visitor.upsert({
      where: { fingerprint },
      update: {
        lastSeen: new Date(),
        visits: { increment: 1 },
        consentType,
        country: consentType === "all" ? (geo.country || null) : null,
        city: consentType === "all" ? (geo.city || null) : null,
        device: consentType === "all" ? device : null,
        browser: consentType === "all" ? browser : null,
        os: consentType === "all" ? os : null,
      },
      create: {
        fingerprint,
        consentType,
        country: consentType === "all" ? (geo.country || null) : null,
        city: consentType === "all" ? (geo.city || null) : null,
        device: consentType === "all" ? device : null,
        browser: consentType === "all" ? browser : null,
        os: consentType === "all" ? os : null,
      },
    });

    return NextResponse.json({ visitorId: visitor.id });
  } catch (error) {
    // Fail silently, never break the UI
    console.error("Identify failed silently:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
