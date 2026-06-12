import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";

export default async function Footer() {
  const settings = await getSiteSettings();
  const socials = [
    { label: "GitHub", href: settings.socialGithub },
    { label: "LinkedIn", href: settings.socialLinkedin },
    { label: "Twitter", href: settings.socialTwitter },
    { label: "Email", href: settings.socialEmail ? `mailto:${settings.socialEmail}` : "" },
  ].filter((s) => s.href !== "");

  return (
    <footer className="relative z-10 border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 md:flex-row md:justify-between">
        <p className="text-sm text-zinc-400">
          © {new Date().getFullYear()} {settings.siteName}. Built with Next.js + Three.js.
        </p>
        <ul className="flex gap-5">
          {socials.map((s) => (
            <li key={s.label}>
              <Link
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-400 transition-colors hover:text-cyan-accent"
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
