/**
 * @file app/api/analytics/pageview/route.ts
 * @description Records page views. Classifies referrer server-side using
 * lib/classify-referrer (tldts + JSON database). Client sends raw referrer only.
 * Handles unique blog post view count increments.
 * Enforces server-side 24-hour unique pageview checks.
 * 
 * @exports
 * - POST(request: NextRequest): Promise<NextResponse>
 * - PATCH(request: NextRequest): Promise<NextResponse>
 * - dynamic: Constant / Helper
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyReferrer } from "@/lib/classify-referrer";

export const dynamic = "force-dynamic";

const pendingPageViews = new Map<string, Promise<any>>();

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

    // Normalize path (ensure consistent format: strip trailing slash except for root "/")
    const normalizedPath = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;

    const lockKey = `${visitorId}:${normalizedPath}`;
    if (pendingPageViews.has(lockKey)) {
      await pendingPageViews.get(lockKey);
      return NextResponse.json({ success: true, tracked: false });
    }

    let resolvePromise: any;
    const lockPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    pendingPageViews.set(lockKey, lockPromise);

    try {
      // Verify visitor exists
      const visitorExists = await prisma.visitor.findUnique({ where: { id: visitorId } });
      if (!visitorExists) {
        return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
      }

      // ── Server-Side Deduplication Check ──────────────────────────────────────
      // Check if this visitor already recorded a view for this path in the last 24h
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existingView = await prisma.pageView.findFirst({
        where: {
          visitorId,
          path: normalizedPath,
          timestamp: { gte: twentyFourHoursAgo },
        },
      });

      if (existingView) {
        // Already tracked in the last 24 hours. Return early to prevent database inflation.
        return NextResponse.json({ success: true, tracked: false });
      }

    // ── Classify referrer server-side using the library ─────────────────────
    const classified = classifyReferrer(referrer);
    // UTM source takes priority over referrer-derived source
    const trafficSource = utmSource ? String(utmSource).toLowerCase() : classified.source;

    // Execute database insert and blog view increment in a single transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create pageview record
      await tx.pageView.create({
        data: {
          visitorId,
          path: normalizedPath,
          referrer: classified.cleanReferrer,   // store cleaned referrer (no tracking params)
          trafficSource,
          utmSource:    utmSource    || null,
          utmMedium:    utmMedium    || null,
          utmCampaign:  utmCampaign  || null,
          utmContent:   utmContent   || null,
          utmTerm:      utmTerm      || null,
        },
      });

      // 2. If it is a blog post page view, increment the blog post's unique view count
      if (normalizedPath.startsWith("/blog/")) {
        const slug = normalizedPath.substring("/blog/".length).trim();
        if (slug && !slug.includes("/")) {
          try {
            await tx.post.update({
              where: { slug },
              data: { views: { increment: 1 } },
            });
          } catch (postError) {
            console.error(`Failed to increment views for blog post slug in transaction: ${slug}`, postError);
            // We catch post increment failure so that general page views still get tracked
            // even if a post record fails or is missing.
          }
        }
      }
    });

      return NextResponse.json({ success: true, tracked: true });
    } finally {
      pendingPageViews.delete(lockKey);
      resolvePromise();
    }
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

    // Normalize path
    const normalizedPath = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;

    const lastPageView = await prisma.pageView.findFirst({
      where: { visitorId, path: normalizedPath },
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
