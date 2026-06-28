/**
 * @file lib/classify-referrer.ts
 * @description Referrer classification engine using tldts for robust domain
 * extraction and a maintainable JSON database for source mapping.
 *
 * To add a new traffic source: edit lib/referrer-sources.json — no code changes needed.
 */

import { parse as parseDomain } from "tldts";
import Referer from "referer-parser";
import sources from "./referrer-sources.json";

export interface ReferrerResult {
  /** Canonical source key — e.g. "linkedin", "google", "direct" */
  source: string;
  /** Human-readable display label — e.g. "LinkedIn", "Google" */
  label: string;
  /** Traffic medium — "search" | "social" | "referral" | "direct" | "unknown" */
  medium: "search" | "social" | "referral" | "direct" | "unknown";
  /** Cleaned referrer URL (origin + pathname, no query params) or null for direct */
  cleanReferrer: string | null;
}

// Own-domain hostnames — these should never appear as referrers
const OWN_DOMAINS = new Set([
  "hanan-bhatti.site",
  "www.hanan-bhatti.site",
  "localhost",
  "127.0.0.1",
  "::1",
]);

const DIRECT: ReferrerResult = {
  source: "direct",
  label: "Direct",
  medium: "direct",
  cleanReferrer: null,
};

type SourceEntry = { source: string; label: string; medium: string };
type SourceMap = Record<string, SourceEntry>;
type AndroidMap = Record<string, SourceEntry>;

const domainMap = sources as unknown as SourceMap & { _android_apps: { _comment?: string } & AndroidMap; _comment?: string; _format?: string };

/**
 * Classify a raw referrer URL into a traffic source.
 * Handles: https://, http://, android-app://, and blank (direct).
 */
export function classifyReferrer(rawReferrer: string | null | undefined): ReferrerResult {
  if (!rawReferrer || rawReferrer.trim() === "") return DIRECT;

  const ref = rawReferrer.trim();

  // ── Android deep-link app scheme: android-app://com.linkedin.android/ ──────
  if (ref.startsWith("android-app://")) {
    const appId = ref.replace("android-app://", "").replace(/\/$/, "").toLowerCase();
    const androidApps = domainMap._android_apps as AndroidMap;
    const match = androidApps[appId];
    if (match) {
      return {
        source: match.source,
        label: match.label,
        medium: match.medium as ReferrerResult["medium"],
        cleanReferrer: ref,
      };
    }
    // Unknown Android app — extract readable name from app ID
    const appLabel = appId.split(".").slice(-1)[0] ?? appId;
    return {
      source: appId,
      label: `App: ${appLabel}`,
      medium: "unknown",
      cleanReferrer: ref,
    };
  }

  // ── Standard HTTP/HTTPS URLs ─────────────────────────────────────────────
  let url: URL;
  try {
    url = new URL(ref);
  } catch {
    return DIRECT;
  }

  // Strip own domain (admin page, localhost, etc.)
  const hostname = url.hostname.toLowerCase();
  if (OWN_DOMAINS.has(hostname)) return DIRECT;
  if (hostname.endsWith(".hanan-bhatti.site")) return DIRECT;

  // Strip admin paths from own domain (belt-and-suspenders)
  if (url.pathname.startsWith("/admin")) return DIRECT;

  // Clean referrer: keep origin + pathname, strip query params (privacy)
  const cleanReferrer = `${url.origin}${url.pathname}`.replace(/\/$/, "") || url.origin;

  // ── referer-parser attribution library ───────────────────────────────────
  try {
    const parser = new Referer(ref);
    if (parser.known && parser.referer) {
      return {
        source: parser.referer.toLowerCase(),
        label: parser.referer,
        medium: (parser.medium === "unknown" ? "referral" : parser.medium) as ReferrerResult["medium"],
        cleanReferrer,
      };
    }
  } catch (err) {
    console.error("referer-parser parsing failed:", err);
  }

  // ── Exact hostname match (e.g. "m.facebook.com") ─────────────────────────
  const exactMatch = domainMap[hostname];
  if (exactMatch && typeof exactMatch === "object" && "source" in exactMatch) {
    return {
      source: exactMatch.source,
      label: exactMatch.label,
      medium: exactMatch.medium as ReferrerResult["medium"],
      cleanReferrer,
    };
  }

  // ── tldts: extract registrable domain (e.g. "facebook.com" from "l.facebook.com") ──
  const parsed = parseDomain(hostname, { allowPrivateDomains: false });
  const registrableDomain = parsed.domain && parsed.publicSuffix
    ? `${parsed.domain}.${parsed.publicSuffix}`
    : null;

  if (registrableDomain) {
    const domainMatch = domainMap[registrableDomain];
    if (domainMatch && typeof domainMatch === "object" && "source" in domainMatch) {
      return {
        source: domainMatch.source,
        label: domainMatch.label,
        medium: domainMatch.medium as ReferrerResult["medium"],
        cleanReferrer,
      };
    }
  }

  // ── Unknown external referrer — use clean domain as source key ───────────
  const cleanDomain = registrableDomain ?? hostname;
  return {
    source: cleanDomain,
    label: cleanDomain,
    medium: "referral",
    cleanReferrer,
  };
}

/**
 * Convenience: extract just the traffic source key string.
 * Used for the trafficSource field in PageView.
 */
export function getTrafficSource(referrer: string | null | undefined, utmSource?: string | null): string {
  if (utmSource) return utmSource.toLowerCase();
  return classifyReferrer(referrer).source;
}

/**
 * For the analytics display page: groups known traffic sources by medium.
 */
export const MEDIUM_LABELS: Record<string, string> = {
  search: "Organic Search",
  social: "Social",
  referral: "Referral",
  direct: "Direct",
  unknown: "Other",
};
