"use client";

import { SiGithub } from "react-icons/si";
import { FaLinkedin, FaXTwitter } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";

export type SocialIconKey = "github" | "linkedin" | "twitter" | "email";

const ICONS: Record<SocialIconKey, React.ComponentType<{ size?: number; style?: React.CSSProperties; "data-social-el"?: boolean }>> = {
  github: SiGithub,
  linkedin: FaLinkedin,
  twitter: FaXTwitter,
  email: MdEmail,
};

export type SocialItem = {
  label: string;
  href: string;
  icon: SocialIconKey;
};

export function SocialRow({ label, href, icon }: SocialItem) {
  const Icon = ICONS[icon];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "1.25rem 0",
        borderBottom: "1px solid var(--border)",
        color: "var(--text-muted)",
        textDecoration: "none",
        transition: "border-bottom-color 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderBottomColor = "var(--amber)";
        el.querySelectorAll<HTMLElement>("[data-social-el]").forEach(
          (child) => (child.style.color = "var(--amber)")
        );
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderBottomColor = "var(--border)";
        el.querySelectorAll<HTMLElement>("[data-social-el]").forEach(
          (child) => (child.style.color = "")
        );
      }}
    >
      <Icon
        size={20}
        data-social-el
        style={{ color: "var(--text-muted)", flexShrink: 0, transition: "color 0.15s" }}
      />
      <span
        data-social-el
        style={{
          fontFamily: "var(--font-syne), Syne, sans-serif",
          fontWeight: 700,
          fontSize: "1rem",
          color: "#fff",
          transition: "color 0.15s",
        }}
      >
        {label}
      </span>
      <span
        data-social-el
        style={{
          marginLeft: "auto",
          fontFamily: "var(--font-syne), Syne, sans-serif",
          fontSize: "1.2rem",
          color: "var(--text-muted)",
          transition: "color 0.15s",
        }}
      >
        ↗
      </span>
    </a>
  );
}
