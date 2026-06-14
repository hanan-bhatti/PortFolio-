/**
 * @file app/(public)/terms/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - TermsPage (default): Main React component or function
 * - dynamic: Constant / Helper
 * - metadata: Constant / Helper
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for Hanan Bhatti's portfolio.",
};

export default async function TermsPage() {
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
          Terms of <span style={{ color: "var(--amber)" }}>Service</span>.
        </h1>

        <div className="space-y-8 text-sm leading-relaxed text-[#D1D5DB]">
          <section className="space-y-3">
            <h2 className="font-semibold text-[18px] text-white font-syne tracking-tight">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using this website ({siteName}), you agree to comply with and be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the site.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-[18px] text-white font-syne tracking-tight">
              2. Description of Service
            </h2>
            <p>
              This website is a personal portfolio showcasing project repositories, blog writing, photography, and professional experience.
              It is provided purely for informational and demonstration purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-[18px] text-white font-syne tracking-tight">
              3. Contact Form Submissions
            </h2>
            <p>
              Any contact form submissions sent through this website are transmitted directly to {siteName} and read by Hanan Bhatti only.
              We do not guarantee a reply to all inquiries, and we reserve the right to delete messages or block spam at our discretion.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-[18px] text-white font-syne tracking-tight">
              4. Availability & Warranties
            </h2>
            <p>
              This website is provided &quot;as is&quot; and &quot;as available&quot; without any warranties or guarantees of any kind.
              We do not guarantee that the site will always be available, error-free, or secure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-[18px] text-white font-syne tracking-tight">
              5. Intellectual Property
            </h2>
            <p>
              All original content, designs, and materials on this site are the intellectual property of {siteName} unless otherwise noted.
              Code samples and open source projects displayed may be subject to their respective licenses (e.g. MIT, GPL).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-[18px] text-white font-syne tracking-tight">
              6. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms of Service at any time. Any changes will be posted on this page and will be effective immediately upon publication.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold text-[18px] text-white font-syne tracking-tight">
              7. Contact
            </h2>
            <p>
              If you have any questions regarding these Terms of Service, please contact us at{" "}
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
