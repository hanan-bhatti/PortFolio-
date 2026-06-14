/**
 * @file components/ui/Footer.tsx
 * @description React component for Footer.tsx under the ui category.
 * 
 * @exports
 * - Footer (default): Main React component or function
 * - dynamic: Constant / Helper
 */

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SiGithub, SiX, SiGmail } from "react-icons/si";

export const dynamic = "force-dynamic";

// Local definition of Simple Icons LinkedIn SVG since it's missing from the workspace package version
const SiLinkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    fill="currentColor"
    width="1em"
    height="1em"
    {...props}
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export default async function Footer() {
  // Pull all settings dynamically from NeonDB key-value table
  const [rows, resumeRows] = await Promise.all([
    prisma.siteSettings.findMany(),
    prisma.resumeSettings.findMany({ where: { key: "resume_enabled" } }),
  ]);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const resumeMap = new Map(resumeRows.map((r) => [r.key, r.value]));

  const siteName = map.get("siteName") || "Hanan Bhatti";
  const nameParts = siteName.toUpperCase().split(" ");
  const firstName = nameParts[0] || "HANAN";
  const lastName = nameParts.slice(1).join(" ") || "BHATTI";
  const githubUrl = map.get("github_url") || map.get("socialGithub") || "";
  const linkedinUrl = map.get("linkedin_url") || map.get("socialLinkedin") || "";
  const twitterUrl = map.get("twitter_url") || map.get("socialTwitter") || "";
  const publicEmail = map.get("public_email") || map.get("socialEmail") || "";
  const aboutHeroTagline = map.get("about_hero_tagline") || "";
  const photographyEnabled = map.get("photography_enabled") === "true";
  const resumeEnabled = resumeMap.get("resume_enabled") !== "false"; // default true

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/projects", label: "Projects" },
    { href: "/about", label: "About" },
    ...(photographyEnabled ? [{ href: "/photography", label: "Photography" }] : []),
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
    ...(resumeEnabled ? [{ href: "/resume", label: "Resume" }] : []),
  ];

  const socialLinks = [
    githubUrl && {
      label: "GitHub",
      href: githubUrl,
      icon: <SiGithub />,
    },
    linkedinUrl && {
      label: "LinkedIn",
      href: linkedinUrl,
      icon: <SiLinkedin />,
    },
    twitterUrl && {
      label: "Twitter / X",
      href: twitterUrl,
      icon: <SiX />,
    },
    publicEmail && {
      label: "Email",
      href: `mailto:${publicEmail}`,
      icon: <SiGmail />,
    },
  ].filter(Boolean) as { label: string; href: string; icon: React.ReactNode }[];

  return (
    <footer className="w-full relative z-10">
      {/* PART 1: Top content row */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
        style={{
          borderTop: "1px solid var(--border)",
          padding: "4rem max(2rem, 6vw) 2rem",
          background: "var(--bg)",
        }}
      >
        {/* LEFT COLUMN */}
        <div className="flex flex-col items-start">
          <Link
            href="/"
            className="transition-transform hover:scale-102 active:scale-98 mb-3 flex items-center"
            style={{ marginBottom: "0.75rem" }}
          >
            <img
              src="/logo.svg"
              alt="Logo"
              className="w-10 h-10 object-contain rounded-[5px]"
            />
          </Link>
          
          {aboutHeroTagline && (
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "13px",
                color: "var(--text-muted)",
                maxWidth: "280px",
                lineHeight: 1.6,
              }}
            >
              {aboutHeroTagline}
            </p>
          )}

          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            border: "1px solid var(--green-dim)",
            padding: "4px 12px",
            fontSize: "11px",
            color: "var(--green)",
            fontFamily: "Inter",
            letterSpacing: "0.08em",
            marginTop: "1rem",
          }}>
            <span style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--green)",
              animation: "pulse 2s infinite",
              display: "inline-block",
            }} />
            AVAILABLE FOR WORK
          </span>
        </div>

        {/* MIDDLE COLUMN */}
        <div className="flex flex-col items-start md:pl-8">
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: "10px",
              letterSpacing: "0.2em",
              color: "var(--text-muted)",
              marginBottom: "1rem",
            }}
          >
            NAVIGATE
          </p>
          <ul className="flex flex-col" style={{ gap: "0.5rem" }}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="footer-nav-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* LEGAL COLUMN */}
        <div className="flex flex-col items-start md:pl-8">
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: "10px",
              letterSpacing: "0.2em",
              color: "var(--text-muted)",
              marginBottom: "1rem",
            }}
          >
            LEGAL
          </p>
          <ul className="flex flex-col" style={{ gap: "0.5rem" }}>
            <li>
              <Link href="/privacy" className="footer-nav-link">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="footer-nav-link">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col items-start">
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: "10px",
              letterSpacing: "0.2em",
              color: "var(--text-muted)",
              marginBottom: "1rem",
            }}
          >
            FIND ME
          </p>
          <ul className="flex flex-col" style={{ gap: "0.75rem", width: "100%" }}>
            {socialLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-link"
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Location / Meta */}
          <div style={{ marginTop: "1.5rem" }}>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "11px",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              📍 Lahore, Pakistan
            </p>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 400,
                fontSize: "11px",
                color: "rgba(255,255,255,0.15)",
                marginTop: "2px",
              }}
            >
              GMT+5 · Usually awake at 2am
            </p>
          </div>
        </div>
      </div>

      {/* PART 2: Big editorial signature */}
      <div
        className="footer-signature-container"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "var(--bg)",
          padding: "0 max(1rem, 3vw)",
          paddingBottom: "0",
          lineHeight: 0.85,
        }}
      >
        <span
          className="footer-signature-text"
          style={{
            fontFamily: "var(--font-syne), Syne, sans-serif",
            fontWeight: 800,
            color: "rgba(255, 255, 255, 0.04)",
            whiteSpace: "nowrap",
            userSelect: "none",
            pointerEvents: "none",
            letterSpacing: "-0.02em",
            marginBottom: "-2rem",
            display: "block",
            transition: "color 0.4s ease",
            lineHeight: 0.85,
            fontSize: "clamp(6rem, 14vw, 12rem)",
          }}
        >
          {firstName}
          <br />
          {lastName}
        </span>
      </div>

      {/* PART 3: Bottom bar */}
      <div
        className="footer-bottom-bar"
        style={{
          borderTop: "1px solid var(--border)",
          padding: "1rem max(2rem, 6vw)",
          background: "var(--bg)",
        }}
      >
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: "12px",
            color: "var(--text-muted)",
          }}
        >
          &copy; {new Date().getFullYear()} {siteName}
        </p>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: "12px",
            color: "var(--text-muted)",
          }}
        >
          Built with Next.js
        </p>
      </div>

      {/* Custom Styles */}
      <style>{`
        .footer-nav-link {
          font-family: 'Inter', sans-serif;
          font-weight: 400;
          font-size: 13px;
          color: var(--text-muted);
          transition: color 0.15s ease;
        }
        .footer-nav-link:hover {
          color: var(--amber) !important;
        }

        .footer-social-link {
          display: flex;
          flex-direction: row;
          gap: 0.75rem;
          align-items: center;
          font-family: 'Inter', sans-serif;
          font-weight: 400;
          font-size: 13px;
          color: var(--text-muted);
          transition: color 0.15s ease;
        }
        .footer-social-link:hover {
          color: var(--amber) !important;
        }
        .footer-social-link svg {
          font-size: 16px;
          color: var(--text-muted);
          transition: color 0.15s ease;
        }
        .footer-social-link:hover svg {
          color: var(--amber) !important;
        }

        .footer-signature-container:hover .footer-signature-text {
          color: rgba(245, 158, 11, 0.06) !important;
        }

        .footer-signature-text {
          font-size: clamp(6rem, 14vw, 12rem) !important;
        }

        .footer-bottom-bar {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
        }
      `}</style>
    </footer>
  );
}
