/**
 * @file app/api/analytics/identify/route.ts
 * @description Identifies and fingerprints visitors, parses UA with ua-parser-js,
 * enriches geo data. Filters bots, crawlers, and internal traffic.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { UAParser } from "ua-parser-js";

export const dynamic = "force-dynamic";

// ── Bot / Crawler detection ───────────────────────────────────────────────────
const BOT_PATTERN =
  /bot|crawler|spider|scraper|headless|prerender|lighthouse|pagespeed|semrush|ahrefs|moz|dataforseo|pingdom|uptimerobot|statuspage|node-fetch|python-requests|curl|wget|axios|postman|insomnia|go-http|java\/|okhttp|dart:|cfnetwork|libwww/i;

// ── Internal / dev IP ranges ─────────────────────────────────────────────────
const INTERNAL_IPS = new Set(["127.0.0.1", "::1", "localhost", "::ffff:127.0.0.1"]);

function isInternalIp(ip: string): boolean {
  return (
    INTERNAL_IPS.has(ip) ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.3")
  );
}

// ── Traffic source classification ────────────────────────────────────────────
function classifyTrafficSource(referrer: string, utmSource?: string | null): string {
  if (utmSource) return utmSource.toLowerCase();
  if (!referrer) return "direct";

  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return "direct";
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const proto = url.protocol;

  // Android app deep links (e.g. android-app://com.linkedin.android/)
  if (proto === "android-app:") {
    if (/linkedin/i.test(referrer)) return "linkedin";
    if (/twitter|x\.com/i.test(referrer)) return "twitter";
    if (/facebook/i.test(referrer)) return "facebook";
    if (/instagram/i.test(referrer)) return "instagram";
    if (/github/i.test(referrer)) return "github";
    return "other";
  }

  if (/google\./i.test(host)) return "google";
  if (/bing\./i.test(host)) return "bing";
  if (/yahoo\./i.test(host)) return "yahoo";
  if (/duckduckgo\./i.test(host)) return "duckduckgo";
  if (/linkedin\.com|lnkd\.in/i.test(host)) return "linkedin";
  if (/github\.com|github\.io/i.test(host)) return "github";
  if (/twitter\.com|x\.com|t\.co/i.test(host)) return "twitter";
  if (/facebook\.com|fb\.com|m\.facebook\.com/i.test(host)) return "facebook";
  if (/instagram\.com/i.test(host)) return "instagram";
  if (/reddit\.com/i.test(host)) return "reddit";
  if (/whatsapp\.com/i.test(host)) return "whatsapp";
  if (/medium\.com/i.test(host)) return "medium";
  if (/dev\.to/i.test(host)) return "devto";

  return host; // Store the cleaned hostname for unknown referrers
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip")?.trim() ||
      "127.0.0.1";

    const userAgent = request.headers.get("user-agent") || "";

    // ── Silently ignore bots and crawlers ────────────────────────────────────
    if (BOT_PATTERN.test(userAgent) || !userAgent) {
      return NextResponse.json({ skip: true });
    }

    // ── Silently ignore internal / dev traffic (only in production) ──────────
    if (process.env.NODE_ENV === "production" && isInternalIp(ip)) {
      return NextResponse.json({ skip: true });
    }

    // ── Check if analytics is enabled ────────────────────────────────────────
    const setting = await prisma.siteSettings.findFirst({
      where: { key: "analytics_enabled" },
    });
    if (setting?.value === "false") {
      return NextResponse.json({ error: "Analytics disabled" }, { status: 403 });
    }

    // ── Fingerprint (never store raw IP) ─────────────────────────────────────
    const salt = process.env.FINGERPRINT_SALT || "default-salt-value";
    const fingerprint = createHash("sha256")
      .update(ip + userAgent + salt)
      .digest("hex");

    // ── Consent ──────────────────────────────────────────────────────────────
    const consentCookie = request.cookies.get("cookie_consent")?.value;
    const consentType = consentCookie === "all" ? "all" : "essential";

    // ── UA Parsing (ua-parser-js) — always parse, consent controls what we store ──
    const parser = new UAParser(userAgent);
    const ua = parser.getResult();

    // ua-parser-js returns undefined for desktop (no device.type for desktop)
    const deviceType = ua.device.type ?? "desktop";
    const browser =
      ua.browser.name
        ? ua.browser.name.replace(/\s+/g, "") // "Mobile Safari" → "MobileSafari"
        : null;
    const os = ua.os.name ?? null;

    // ── Geo enrichment — only when consent=all and not internal IP ───────────
    let country: string | null = null;
    let city: string | null = null;

    if (consentType === "all") {
      try {
        const geoRes = await fetch(
          `http://ip-api.com/json/${ip}?fields=status,country,city`,
          { signal: AbortSignal.timeout(3000) }
        );
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (geo.status === "success") {
            country = geo.country || null;
            city = geo.city || null;
          }
        }
      } catch {
        // geo is best-effort
      }
    }

    // ── Upsert visitor ────────────────────────────────────────────────────────
    // Always store device/browser/os (consent controls geo only)
    const visitor = await prisma.visitor.upsert({
      where: { fingerprint },
      update: {
        lastSeen: new Date(),
        visits: { increment: 1 },
        consentType,
        device: deviceType,
        browser: browser,
        os: os,
        country: consentType === "all" ? country : undefined,
        city: consentType === "all" ? city : undefined,
      },
      create: {
        fingerprint,
        consentType,
        device: deviceType,
        browser: browser,
        os: os,
        country: consentType === "all" ? country : null,
        city: consentType === "all" ? city : null,
      },
    });

    const response = NextResponse.json({ visitorId: visitor.id });
    response.cookies.set("visitorId", visitor.id, {
      path: "/",
      maxAge: 31536000, // 1 year
      sameSite: "lax",
      httpOnly: false, // Must be readable by client JS for UTM tracking and code copy events
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (error) {
    console.error("Identify failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
