/**
 * @file app/api/analytics/pageview/route.ts
 * @description Next.js API route handling requests for the route.ts endpoint.
 * 
 * @exports
 * - PATCH(): Function
 * - POST(): Function
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Check if site-wide analytics is enabled
    const settings = await prisma.siteSettings.findMany({
      where: { key: "analytics_enabled" },
    });
    const analyticsEnabledSetting = settings[0]?.value ?? "true";
    if (analyticsEnabledSetting === "false") {
      return NextResponse.json({ success: true, message: "Analytics disabled" });
    }

    const body = await request.json();
    const {
      visitorId,
      path,
      referrer,
      trafficSource,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
    } = body;

    if (!visitorId || !path) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Double check that visitor exists
    const visitorExists = await prisma.visitor.findUnique({
      where: { id: visitorId },
    });

    if (!visitorExists) {
      return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
    }

    await prisma.pageView.create({
      data: {
        visitorId,
        path,
        referrer: referrer || null,
        trafficSource: trafficSource || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmContent: utmContent || null,
        utmTerm: utmTerm || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PageView POST failed silently:", error);
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

    // Find the last pageview for this visitor and path
    const lastPageView = await prisma.pageView.findFirst({
      where: {
        visitorId,
        path,
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    if (lastPageView) {
      await prisma.pageView.update({
        where: { id: lastPageView.id },
        data: {
          duration: Math.round(duration),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PageView PATCH failed silently:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
