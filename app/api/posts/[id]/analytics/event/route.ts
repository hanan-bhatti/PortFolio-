/**
 * @file app/api/posts/[id]/analytics/event/route.ts
 * @description API endpoint to record public analytics events (scroll depth, time on page, exit intent).
 * Supports both single events and arrays of events (for batching/unloading).
 * Returns a 204 No Content response.
 * 
 * @exports
 * - POST(): Function
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/rate-limit";

const VALID_EVENT_TYPES = [
  "scroll_depth",
  "time_on_page",
  "copy_event",
  "bounce",
  "explored",
  "exit_intent_shown",
  "exit_intent_converted",
];

/**
 * POST: Logs one or more visitor analytics events.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: postId } = await params;
    const body = await req.json();

    const events = Array.isArray(body) ? body : [body];

    if (events.length === 0) {
      return new NextResponse(null, { status: 204 });
    }

    const firstEvent = events[0];
    const visitorId = firstEvent?.visitorId;
    if (!visitorId || typeof visitorId !== "string" || visitorId.trim() === "") {
      return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
    }

    // Apply relaxed rate limiting specifically for analytics batches
    if (isRateLimited(`analytics-event:${visitorId}:${postId}`)) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }

    const createData = events
      .filter((evt) => evt && typeof evt === "object" && VALID_EVENT_TYPES.includes(evt.eventType))
      .map((evt) => ({
        postId,
        visitorId: evt.visitorId,
        eventType: evt.eventType,
        value: evt.value ? String(evt.value) : null,
        referrer: evt.referrer || null,
        utmSource: evt.utmSource || null,
        utmMedium: evt.utmMedium || null,
        utmCampaign: evt.utmCampaign || null,
      }));

    if (createData.length > 0) {
      await prisma.postAnalyticsEvent.createMany({
        data: createData,
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("POST /api/posts/[id]/analytics/event failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
