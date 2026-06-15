/**
 * @file app/api/resume/download/route.ts
 * @description Next.js API route handling requests for the route.ts endpoint.
 *
 * @exports
 * - POST(): Function
 * - dynamic: Constant / Helper
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UAParser } from "ua-parser-js";

export const dynamic = "force-dynamic";

// POST /api/resume/download — track a download and return a download id
export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? (forwarded.split(",")[0]?.trim() ?? "unknown") : "unknown";
    const rawUA = request.headers.get("user-agent") || "";

    // ── Parse UA with ua-parser-js ─────────────────────────────────────
    const parser = new UAParser(rawUA);
    const uaResult = parser.getResult();

    const deviceType   = uaResult.device.type   ?? "desktop"; // ua-parser returns undefined for desktop
    const deviceVendor = uaResult.device.vendor  ?? null;
    const deviceModel  = uaResult.device.model   ?? null;
    const browserName  = uaResult.browser.name   ?? null;
    const browserVersion = uaResult.browser.version ?? null;
    const osName       = uaResult.os.name        ?? null;
    const osVersion    = uaResult.os.version     ?? null;
    const cpuArch      = uaResult.cpu.architecture ?? null;

    // ── Enriched geo via ip-api.com (free, no key needed) ─────────────
    // Fields: status, country, regionName, city, timezone, isp, org, lat, lon
    let country: string | null  = null;
    let city: string | null     = null;
    let region: string | null   = null;
    let timezone: string | null = null;
    let isp: string | null      = null;
    let lat: number | null      = null;
    let lng: number | null      = null;

    try {
      const fields = "status,country,regionName,city,timezone,isp,org,lat,lon";
      const geo = await fetch(
        `http://ip-api.com/json/${ip}?fields=${fields}`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (geo.ok) {
        const data = await geo.json();
        if (data.status === "success") {
          country  = data.country   || null;
          city     = data.city      || null;
          region   = data.regionName || null;
          timezone = data.timezone  || null;
          // Prefer org (e.g. "AS45595 Pakistan Telecom") over raw isp for richer info
          isp      = data.org || data.isp || null;
          lat      = typeof data.lat === "number" ? data.lat : null;
          lng      = typeof data.lon === "number" ? data.lon : null;
        }
      }
    } catch {
      // geo is best-effort — never block the download
    }

    const record = await prisma.resumeDownload.create({
      data: {
        visitorIp: ip,
        // geo
        country,
        city,
        region,
        timezone,
        isp,
        lat,
        lng,
        // raw UA
        userAgent: rawUA,
        // parsed UA
        deviceType,
        deviceVendor,
        deviceModel,
        browserName,
        browserVersion,
        osName,
        osVersion,
        cpuArch,
      },
    });

    return NextResponse.json({ downloadId: record.id });
  } catch (error) {
    console.error("POST /api/resume/download failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
