/**
 * @file app/api/analytics/pageview/route.ts
 * @description Records page views. Classifies referrer server-side using
 * lib/classify-referrer (tldts + JSON database). Client sends raw referrer only.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyReferrer } from "@/lib/classify-referrer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Check if analytics is enabled
    const setting = await prisma.siteSettings.findFirst({
      where: { key: "analytics_enabled" },
    });
    if (setting?.value === "false") {
      return NextResponse.json({ success: true, message: "Analytics disabled" });
    }

    const body = await request.json();
    const {
      visitorId,
      path,
      referrer,     // raw referrer URL from client
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
    } = body;

    if (!visitorId || !path) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify visitor exists
    const visitorExists = await prisma.visitor.findUnique({ where: { id: visitorId } });
    if (!visitorExists) {
      return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
    }

    // ── Classify referrer server-side using the library ─────────────────────
    const classified = classifyReferrer(referrer);
    // UTM source takes priority over referrer-derived source
    const trafficSource = utmSource ? String(utmSource).toLowerCase() : classified.source;

    await prisma.pageView.create({
      data: {
        visitorId,
        path,
        referrer: classified.cleanReferrer,   // store cleaned referrer (no tracking params)
        trafficSource,
        utmSource:    utmSource    || null,
        utmMedium:    utmMedium    || null,
        utmCampaign:  utmCampaign  || null,
        utmContent:   utmContent   || null,
        utmTerm:      utmTerm      || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PageView POST failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { visitorId, path, duration } = body;

    if (!visitorId || !path || duration === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const lastPageView = await prisma.pageView.findFirst({
      where: { visitorId, path },
      orderBy: { timestamp: "desc" },
    });

    if (lastPageView) {
      await prisma.pageView.update({
        where: { id: lastPageView.id },
        data: { duration: Math.round(duration) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PageView PATCH failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
