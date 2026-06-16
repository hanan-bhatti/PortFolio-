/**
 * @file lib/analytics.ts
 * @description Client-side analytics. Sends raw referrer to server — all
 * classification is done server-side via lib/classify-referrer.ts.
 * Filters internal paths (admin, api, etc.) from being tracked.
 * Implements 24-hour unique pageview deduplication using localStorage.
 * 
 * @exports
 * - initAnalytics(): Promise<string | null>
 * - trackPageView(path: string): Promise<void>
 * - trackDuration(path: string, seconds: number): Promise<void>
 * - getVisitorId(): string | null
 */

let visitorId: string | null = null;

// Paths that should never be tracked
const SKIP_PATH_PREFIXES = ["/admin", "/api", "/_next", "/favicon"];

function shouldSkipPath(path: string): boolean {
  return SKIP_PATH_PREFIXES.some((p) => path.startsWith(p));
}

export async function initAnalytics(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (shouldSkipPath(window.location.pathname)) return null;

  if (visitorId) return visitorId;
  const cached = localStorage.getItem("visitorId");
  if (cached) {
    visitorId = cached;
    return visitorId;
  }

  try {
    const res = await fetch("/api/analytics/identify", { method: "POST" });
    if (!res.ok) throw new Error(`Identify failed: ${res.status}`);
    const data = await res.json();

    // Server returns { skip: true } for bots / internal IPs
    if (data.skip) return null;

    if (data.visitorId) {
      visitorId = data.visitorId as string;
      localStorage.setItem("visitorId", data.visitorId as string);
      return visitorId;
    }
  } catch {
    // fail silently
  }
  return null;
}

export async function trackPageView(path: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (shouldSkipPath(path)) return;

  const vid = getVisitorId();
  if (!vid) return;

  // Normalize path (remove trailing slash except for root path "/")
  const normalizedPath = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;

  // unique pageview check: once per path per 24 hours
  const VIEWED_ROUTES_KEY = "portfolio_viewed_routes";
  let viewedRoutes: Record<string, number> = {};
  try {
    const stored = localStorage.getItem(VIEWED_ROUTES_KEY);
    if (stored) {
      viewedRoutes = JSON.parse(stored);
    }
  } catch {
    // ignore
  }

  const now = Date.now();
  const lastViewTime = viewedRoutes[normalizedPath];
  if (lastViewTime && (now - lastViewTime < 24 * 60 * 60 * 1000)) {
    // Already tracked within 24 hours, skip
    return;
  }

  // Raw referrer — classification happens server-side
  const referrer = document.referrer || null;

  // UTM params — read from URL, persist in session
  const params = new URLSearchParams(window.location.search);
  const utmSource   = params.get("utm_source");
  const utmMedium   = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const utmContent  = params.get("utm_content");
  const utmTerm     = params.get("utm_term");

  const hasUtm = Boolean(utmSource || utmMedium || utmCampaign || utmContent || utmTerm);

  let sessionUtm = {
    source: null as string | null,
    medium: null as string | null,
    campaign: null as string | null,
    content: null as string | null,
    term: null as string | null,
  };

  if (hasUtm) {
    sessionUtm = { source: utmSource, medium: utmMedium, campaign: utmCampaign, content: utmContent, term: utmTerm };
    sessionStorage.setItem("utm_attribution", JSON.stringify(sessionUtm));
  } else {
    try {
      const cached = sessionStorage.getItem("utm_attribution");
      if (cached) sessionUtm = JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  // Record that we are tracking this view now in localStorage
  viewedRoutes[normalizedPath] = now;
  try {
    localStorage.setItem(VIEWED_ROUTES_KEY, JSON.stringify(viewedRoutes));
  } catch {
    // ignore
  }

  try {
    await fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId: vid,
        path: normalizedPath, // Send normalized path to match server-side queries
        referrer,           // raw — server classifies this
        utmSource:    utmSource    ?? sessionUtm.source,
        utmMedium:    utmMedium    ?? sessionUtm.medium,
        utmCampaign:  utmCampaign  ?? sessionUtm.campaign,
        utmContent:   utmContent   ?? sessionUtm.content,
        utmTerm:      utmTerm      ?? sessionUtm.term,
      }),
    });
  } catch {
    // fail silently
  }
}

export async function trackDuration(path: string, seconds: number): Promise<void> {
  if (typeof window === "undefined") return;
  if (shouldSkipPath(path)) return;

  const vid = getVisitorId();
  if (!vid) return;

  const normalizedPath = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;

  try {
    await fetch("/api/analytics/pageview", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: vid, path: normalizedPath, duration: seconds }),
    });
  } catch {
    // fail silently
  }
}

export function getVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  return visitorId || localStorage.getItem("visitorId");
}
