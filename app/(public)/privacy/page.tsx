import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Hanan Bhatti's portfolio.",
};

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  const contactEmail = settings.socialEmail || "hannanbhatti2006@gmail.com";
  const siteName = settings.siteName || "Hanan Bhatti";

  return (
    <div
      style={{
        background: "var(--bg)",
        minHeight: "100vh",
        color: "var(--text-primary)",
        fontFamily: "var(--font-inter), Inter, sans-serif",
        paddingTop: "clamp(6rem, 14vh, 10rem)",
        paddingBottom: "8rem",
        paddingLeft: "clamp(1.5rem, 6vw, 6rem)",
        paddingRight: "clamp(1.5rem, 6vw, 6rem)",
      }}
    >
      <div style={{ maxWidth: "800px", position: "relative", zIndex: 1 }}>
        <p
          style={{
            fontWeight: 600,
            fontSize: "11px",
            letterSpacing: "0.2em",
            color: "var(--green)",
            marginBottom: "1.5rem",
            textTransform: "uppercase",
          }}
        >
          Legal
        </p>

        <h1
          style={{
            fontFamily: "var(--font-syne), Syne, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(3rem, 7vw, 5rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            color: "#fff",
            marginBottom: "3rem",
          }}
        >
          Privacy <span style={{ color: "var(--amber)" }}>Policy</span>.
        </h1>

        <div className="space-y-8 text-sm leading-relaxed text-[#D1D5DB]">
          <section className="space-y-3">
            <h2 className="font-semibold text-[18px] text-white font-syne tracking-tight">
              1. Overview
            </h2>
            <p>
              This website ({siteName}) is a personal portfolio. We value your privacy and believe in keeping data collection minimal, transparent, and first-party.
              All collected data remains on our servers — we do not sell, rent, or share your data with any third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-[18px] text-white font-syne tracking-tight">
              2. Data We Collect
            </h2>
            <p>
              If you consent to analytics cookies, we collect first-party analytics data to understand how visitors interact with this site. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Hashed IP address (fingerprinted using a salted SHA-256 hash to identify repeat visits; we never store your raw IP address).</li>
              <li>Page views (pages visited and timestamps).</li>
              <li>Estimated visit duration (seconds spent on a page).</li>
              <li>Geolocation data (country and city estimated from IP before it is hashed).</li>
              <li>Device parameters (device type, browser name, and operating system).</li>
            </ul>
            <p>
              If you do not accept analytics cookies (or choose &quot;Essential Only&quot;), we only track the visitor fingerprint, page views, and duration.
              We do <strong>not</strong> track country, city, device, browser, or operating system for essential-only visits.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-[18px] text-white font-syne tracking-tight">
              3. Contact Form Submissions
            </h2>
            <p>
              When you submit a contact form, we collect the details you provide: your name, email address, subject, and message.
              This information is stored securely in our database and is used solely to respond to your inquiry.
              To help us block spam and abuse, we associate your message with your visitor ID, but this link is kept entirely private and secure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-[18px] text-white font-syne tracking-tight">
              4. Cookies
            </h2>
            <p>
              We use first-party cookies to store your cookie consent preferences:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>cookie_consent</strong>: Stores whether you accepted analytics (<code className="text-amber">&quot;all&quot;</code>) or essential-only (<code className="text-amber">&quot;essential&quot;</code>) tracking. Expiries after 365 days.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-[18px] text-white font-syne tracking-tight">
              5. Data Security & Storage
            </h2>
            <p>
              We run all tracking services directly on our own host/database infrastructure.
              Data is stored securely on our first-party servers and is never shared, sold, or distributed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-[18px] text-white font-syne tracking-tight">
              6. Contact Information
            </h2>
            <p>
              If you have any questions about this Privacy Policy or would like to request deletion of your messages/visit data, please reach out via email at{" "}
              <a href={`mailto:${contactEmail}`} className="text-[#F59E0B] underline hover:text-white transition-colors">
                {contactEmail}
              </a>
              .
            </p>
          </section>
        </div>

        <div style={{ marginTop: "4rem", borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
          <Link href="/" className="text-xs font-semibold tracking-wider text-[#F59E0B] uppercase hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
