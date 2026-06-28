/**
 * @file app/(public)/contact/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - ContactPage (default): Main React component or function
 * - dynamic: Constant / Helper
 * - metadata: Constant / Helper
 */

import type { Metadata } from "next";
import Image from "next/image";
import { getSiteSettings } from "@/lib/settings";
import ContactForm from "@/components/forms/ContactForm";
import { SocialRow, type SocialItem } from "@/components/ui/SocialRow";
import { getOrCreateShortLink } from "@/lib/shortener";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Hanan Bhatti — open to work, freelance, and collaboration.",
};

// ─── Marquee ────────────────────────────────────────────────────────────────
function ContactMarquee() {
  const items = [
    "LET'S TALK",
    "OPEN TO WORK",
    "LAHORE, PK",
    "AVAILABLE FOR FREELANCE",
    "BUILD WITH ME",
    "GMT+5",
    "REPLY WITHIN 24HRS",
  ];

  const content = (
    <div className="flex items-center gap-6 pr-6">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-6">
          <span style={{ color: "var(--amber)" }}>●</span>
          <span>{item}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border)",
        padding: "14px 0",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      <div className="animate-marquee-scroll flex text-[12px] font-semibold tracking-[0.15em] font-inter"
        style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}
      >
        {content}
        {content}
      </div>
    </div>
  );
}


// ─── Page ────────────────────────────────────────────────────────────────────
export default async function ContactPage() {
  const settings = await getSiteSettings();

  const [githubCode, linkedinCode, twitterCode, emailCode] = await Promise.all([
    settings.socialGithub ? getOrCreateShortLink(`${settings.socialGithub}?utm_source=portfolio&utm_medium=contact`, "link") : null,
    settings.socialLinkedin ? getOrCreateShortLink(`${settings.socialLinkedin}?utm_source=portfolio&utm_medium=contact`, "link") : null,
    settings.socialTwitter ? getOrCreateShortLink(`${settings.socialTwitter}?utm_source=portfolio&utm_medium=contact`, "link") : null,
    settings.socialEmail ? getOrCreateShortLink(`mailto:${settings.socialEmail}?utm_source=portfolio&utm_medium=contact`, "link") : null,
  ]);

  const socials: SocialItem[] = [
    settings.socialGithub && {
      label: "GitHub",
      href: githubCode ? `/s/${githubCode}` : settings.socialGithub,
      icon: "github" as const,
    },
    settings.socialLinkedin && {
      label: "LinkedIn",
      href: linkedinCode ? `/s/${linkedinCode}` : settings.socialLinkedin,
      icon: "linkedin" as const,
    },
    settings.socialTwitter && {
      label: "Twitter / X",
      href: twitterCode ? `/s/${twitterCode}` : settings.socialTwitter,
      icon: "twitter" as const,
    },
    settings.socialEmail && {
      label: "Email",
      href: `mailto:${settings.socialEmail}`,
      icon: "email" as const,
    },
  ].filter(Boolean) as SocialItem[];

  return (
    <div
      style={{
        background: "var(--bg)",
        minHeight: "100vh",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* ── SECTION 1: HERO ─────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          paddingTop: "clamp(6rem, 14vh, 10rem)",
          paddingLeft: "clamp(1.5rem, 6vw, 6rem)",
          paddingRight: "clamp(1.5rem, 6vw, 6rem)",
          paddingBottom: "4rem",
        }}
      >
        {/* Background ghost text */}
        <span
          aria-hidden="true"
          className="contact-ghost-text"
          style={{
            position: "absolute",
            top: "5%",
            left: "1%",
            fontFamily: "var(--font-syne), Syne, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(3.5rem, 8vw, 8rem)",
            color: "rgba(255,255,255,0.04)",
            transform: "rotate(-3deg)",
            pointerEvents: "none",
            userSelect: "none",
            whiteSpace: "nowrap",
            zIndex: 0,
            lineHeight: 1,
          }}
        >
          DON&apos;T BE SHY.
        </span>

        {/* Foreground content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Label */}
          <p
            style={{
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontWeight: 600,
              fontSize: "11px",
              letterSpacing: "0.2em",
              color: "var(--green)",
              marginBottom: "1.5rem",
            }}
          >
            CONTACT
          </p>

          {/* Stacked heading */}
          <h1
            className="contact-heading"
            style={{
              fontFamily: "var(--font-syne), Syne, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(4rem, 10vw, 8rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
            }}
          >
            <div style={{ color: "#fff" }}>Let&apos;s</div>
            <div
              className="contact-build-offset"
              style={{
                color: "var(--amber)",
                transform: "translateX(4rem)",
              }}
            >
              build
            </div>
            <div
              className="contact-something-offset"
              style={{ color: "#fff", transform: "translateX(1rem)" }}
            >
              something.
            </div>
          </h1>

          {/* Sub-label */}
          <p
            className="contact-sublabel"
            style={{
              marginTop: "2rem",
              marginLeft: "1rem",
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontWeight: 400,
              fontStyle: "italic",
              fontSize: "14px",
              color: "var(--text-muted)",
              borderLeft: "2px solid var(--amber)",
              paddingLeft: "1rem",
            }}
          >
            — or just say hi. Either works.
          </p>
        </div>
      </section>

      {/* ── SECTION 2: FORM + SOCIALS ───────────────────────────── */}
      <section
        style={{
          position: "relative",
          paddingLeft: "clamp(1.5rem, 6vw, 6rem)",
          paddingRight: "clamp(1.5rem, 6vw, 6rem)",
          paddingBottom: "6rem",
        }}
      >
        {/* Decorative vertical amber line */}
        <div
          aria-hidden="true"
          className="contact-deco-line"
          style={{
            position: "absolute",
            right: "25%",
            top: "10%",
            width: "1px",
            height: "120px",
            background: "var(--amber)",
            opacity: 0.4,
            pointerEvents: "none",
          }}
        />

        {/* Decorative crosshair */}
        <div
          aria-hidden="true"
          className="contact-deco-cross"
          style={{
            position: "absolute",
            left: "5%",
            bottom: "30%",
            color: "var(--green)",
            opacity: 0.3,
            fontSize: "2rem",
            fontFamily: "var(--font-syne), Syne, sans-serif",
            fontWeight: 700,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          +
        </div>

        {/* Decorative amber bar */}
        <div
          aria-hidden="true"
          className="contact-deco-bar"
          style={{
            position: "absolute",
            right: "10%",
            bottom: "20%",
            width: "40px",
            height: "6px",
            background: "var(--amber)",
            opacity: 0.5,
            pointerEvents: "none",
          }}
        />

        <div
          className="contact-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "60% 40%",
            gap: "5rem",
            alignItems: "start",
          }}
        >
          {/* ── LEFT: FORM ─────────────────────────────────────── */}
          <div>
            <ContactForm />
          </div>

          {/* ── RIGHT: SOCIALS ─────────────────────────────────── */}
          <div className="contact-right-col" style={{ position: "relative", overflow: "hidden", maxWidth: "100%", paddingRight: "2rem" }}>
            {/* Ghost initials */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                right: "-2rem",
                top: "-2rem",
                width: "20vw",
                height: "20vw",
                opacity: 0.03,
                transform: "rotate(12deg)",
                pointerEvents: "none",
                userSelect: "none",
                zIndex: 0,
              }}
            >
              <Image
                src="/logo.svg"
                alt="Hanan Bhatti Logo"
                width={200}
                height={200}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>

            {/* Social links */}
            <div style={{ position: "relative", zIndex: 1 }}>
              {socials.map((s) => (
                <SocialRow key={s.label} {...s} />
              ))}
            </div>

            {/* Location info */}
            <div style={{ marginTop: "1.5rem", position: "relative", zIndex: 1 }}>
              <p
                style={{
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fontWeight: 400,
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                Based in Lahore, Pakistan
              </p>
              <p
                style={{
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fontWeight: 400,
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.3)",
                  marginTop: "4px",
                }}
              >
                GMT+5 · Usually awake at 2am
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: MARQUEE ──────────────────────────────────── */}
      <ContactMarquee />

      {/* ── RESPONSIVE STYLES ───────────────────────────────────── */}
      <style>{`
        /* ── Mobile (<768px) ─────────────────────────── */
        @media (max-width: 767px) {

          /* ghost background text: smaller + no bleed */
          .contact-ghost-text {
            font-size: clamp(2rem, 11vw, 4rem) !important;
            left: 0 !important;
            top: 3% !important;
          }

          /* hero heading: tighter size */
          .contact-heading {
            font-size: clamp(3rem, 13vw, 5rem) !important;
          }

          /* remove "build" and "something." horizontal offsets */
          .contact-build-offset {
            transform: translateX(0) !important;
          }
          .contact-something-offset {
            transform: translateX(0) !important;
          }

          /* sub-label: remove left margin so it doesn't push off edge */
          .contact-sublabel {
            margin-left: 0 !important;
          }

          /* switch to single column */
          .contact-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }

          /* right column: no extra padding-right on mobile */
          .contact-right-col {
            padding-right: 0 !important;
          }

          /* hide purely decorative elements */
          .contact-deco-line,
          .contact-deco-cross,
          .contact-deco-bar {
            display: none !important;
          }
        }

        /* ── Tablet (768px – 1023px) ─────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          .contact-grid {
            grid-template-columns: 58% 42% !important;
            gap: 3rem !important;
          }
          .contact-heading {
            font-size: clamp(3.5rem, 8vw, 6rem) !important;
          }
        }
      `}</style>
    </div>
  );
}
