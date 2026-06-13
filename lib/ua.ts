export interface ParsedUA {
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
}

export function parseUserAgent(uaString: string | null): ParsedUA {
  if (!uaString) {
    return { deviceType: "desktop", browser: "unknown", os: "unknown" };
  }

  const ua = uaString.toLowerCase();
  
  // 1. Device Type
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  if (ua.includes("ipad") || ua.includes("tablet") || (ua.includes("android") && !ua.includes("mobile"))) {
    deviceType = "tablet";
  } else if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("ipod") || ua.includes("android")) {
    deviceType = "mobile";
  }

  // 2. OS
  let os = "unknown";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("macintosh") || ua.includes("mac os")) os = "macOS";
  else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) os = "iOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("linux")) os = "Linux";

  // 3. Browser
  let browser = "unknown";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome") || ua.includes("crios")) browser = "Chrome";
  else if (ua.includes("firefox") || ua.includes("fxios")) browser = "Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome") && !ua.includes("chromium")) browser = "Safari";
  else if (ua.includes("opera") || ua.includes("opr/")) browser = "Opera";

  return { deviceType, browser, os };
}
