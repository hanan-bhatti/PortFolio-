let visitorId: string | null = null;

export async function initAnalytics(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  if (visitorId) return visitorId;
  const cached = sessionStorage.getItem("visitorId");
  if (cached) {
    visitorId = cached;
    return visitorId;
  }

  try {
    const res = await fetch("/api/analytics/identify", {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error(`Identify failed with status ${res.status}`);
    }

    const data = await res.json();
    if (data.visitorId) {
      visitorId = data.visitorId as string;
      sessionStorage.setItem("visitorId", data.visitorId as string);
      return visitorId;
    }
  } catch (e) {
    // fail silently
    console.warn("Analytics initialization failed:", e);
  }
  return null;
}

export async function trackPageView(path: string, referrerInput?: string): Promise<void> {
  if (typeof window === "undefined") return;

  const vid = getVisitorId();
  if (!vid) return;

  const referrer = referrerInput || document.referrer || "";

  // 1. Parse URL search params
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const utmContent = params.get("utm_content");
  const utmTerm = params.get("utm_term");

  const hasAnyUtm = Boolean(utmSource || utmMedium || utmCampaign || utmContent || utmTerm);

  let sessionUtm = {
    source: null as string | null,
    medium: null as string | null,
    campaign: null as string | null,
    content: null as string | null,
    term: null as string | null,
  };

  if (hasAnyUtm) {
    // On first page load with UTM params: store in sessionStorage
    sessionUtm = {
      source: utmSource,
      medium: utmMedium,
      campaign: utmCampaign,
      content: utmContent,
      term: utmTerm,
    };
    sessionStorage.setItem("utm_attribution", JSON.stringify(sessionUtm));
  } else {
    // On subsequent pages: read from sessionStorage if current page has no UTM params
    const cached = sessionStorage.getItem("utm_attribution");
    if (cached) {
      try {
        sessionUtm = JSON.parse(cached);
      } catch (e) {
        // fail silently
      }
    }
  }

  // Final UTM params to send
  const finalUtmSource = utmSource || sessionUtm.source || null;
  const finalUtmMedium = utmMedium || sessionUtm.medium || null;
  const finalUtmCampaign = utmCampaign || sessionUtm.campaign || null;
  const finalUtmContent = utmContent || sessionUtm.content || null;
  const finalUtmTerm = utmTerm || sessionUtm.term || null;

  // 2. Parse referrer into traffic source
  function parseTrafficSource(ref: string): string {
    if (!ref) return "direct";
    try {
      const url = new URL(ref);
      const host = url.hostname.replace("www.", "");
      
      if (/google\./i.test(host)) return "google";
      if (/bing\./i.test(host)) return "bing";
      if (/yahoo\./i.test(host)) return "yahoo";
      if (/linkedin\.com/i.test(host)) return "linkedin";
      if (/github\.com/i.test(host)) return "github";
      if (/twitter\.com|x\.com/i.test(host)) return "twitter";
      if (/facebook\.com/i.test(host)) return "facebook";
      if (/instagram\.com/i.test(host)) return "instagram";
      if (/reddit\.com/i.test(host)) return "reddit";
      if (/whatsapp\.com/i.test(host)) return "whatsapp";
      if (/t\.co/i.test(host)) return "twitter";
      
      return host; // return the domain if unknown
    } catch (e) {
      return "direct";
    }
  }

  const trafficSource = finalUtmSource || parseTrafficSource(referrer);

  try {
    await fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId: vid,
        path,
        referrer: referrer || null,
        trafficSource,
        utmSource: finalUtmSource,
        utmMedium: finalUtmMedium,
        utmCampaign: finalUtmCampaign,
        utmContent: finalUtmContent,
        utmTerm: finalUtmTerm,
      }),
    });
  } catch (e) {
    // fail silently
  }
}

export async function trackDuration(path: string, seconds: number): Promise<void> {
  if (typeof window === "undefined") return;

  const vid = getVisitorId();
  if (!vid) return;

  try {
    await fetch("/api/analytics/pageview", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId: vid,
        path,
        duration: seconds,
      }),
    });
  } catch (e) {
    // fail silently
  }
}

export function getVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  return visitorId || sessionStorage.getItem("visitorId");
}
