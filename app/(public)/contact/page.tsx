import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import Hero3D from "@/components/3d/Hero3D";
import Reveal from "@/components/ui/Reveal";
import ContactForm from "@/components/forms/ContactForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with me.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const socials = [
    { label: "GitHub", href: settings.socialGithub, icon: "\u2387" },
    { label: "LinkedIn", href: settings.socialLinkedin, icon: "in" },
    { label: "Twitter / X", href: settings.socialTwitter, icon: "\ud835\udd4f" },
    { label: "Email", href: settings.socialEmail ? `mailto:${settings.socialEmail}` : "", icon: "@" },
  ].filter((s) => s.href !== "");

  return (
    <div className="relative mx-auto max-w-5xl px-4 pt-32 pb-20">
      <Hero3D variant="torusknot" className="absolute top-20 right-0 -z-10 hidden h-96 w-96 opacity-40 md:block" />
      <h1 className="text-4xl font-bold text-white md:text-5xl">
        Get in <span className="gradient-text">Touch</span>
      </h1>
      <p className="mt-3 max-w-xl text-zinc-400">
        Have a question, a project idea or just want to say hi? My inbox is always open.
      </p>

      <div className="mt-12 grid gap-12 md:grid-cols-2">
        <Reveal>
          <ContactForm />
        </Reveal>
        <Reveal delay={0.15}>
          <ul className="space-y-4">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass group flex items-center gap-4 rounded-2xl p-4 transition-shadow hover:glow-cyan"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-accent/20 font-mono text-lg text-cyan-accent transition-transform group-hover:scale-110">
                    {s.icon}
                  </span>
                  <span className="text-zinc-200 group-hover:text-white">{s.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </div>
  );
}
