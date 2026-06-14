"use client";

import { useRef } from "react";
import Link from "next/link";
import HeroPhoto from "./HeroPhoto";

interface HeroSectionProps {
  siteName: string;
  heroPhotoUrl: string;
  heroTagline: string;
  socialGithub?: string;
  socialLinkedin?: string;
  socialTwitter?: string;
}

export default function HeroSection({
  siteName,
  heroPhotoUrl,
  heroTagline,
  socialGithub = "",
  socialLinkedin = "",
  socialTwitter = "",
}: HeroSectionProps) {
  const solidH1Ref = useRef<HTMLHeadingElement>(null);
  const strokeH1Ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLHeadingElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (solidH1Ref.current) {
      solidH1Ref.current.style.setProperty("--mouse-x", `${x}px`);
      solidH1Ref.current.style.setProperty("--mouse-y", `${y}px`);
      solidH1Ref.current.style.setProperty("--spotlight-radius", "100px");
    }
    if (strokeH1Ref.current) {
      strokeH1Ref.current.style.setProperty("--mouse-x", `${x}px`);
      strokeH1Ref.current.style.setProperty("--mouse-y", `${y}px`);
      strokeH1Ref.current.style.setProperty("--spotlight-radius", "100px");
    }
  };

  const handleMouseLeave = () => {
    if (solidH1Ref.current) {
      solidH1Ref.current.style.setProperty("--spotlight-radius", "0px");
    }
    if (strokeH1Ref.current) {
      strokeH1Ref.current.style.setProperty("--spotlight-radius", "0px");
    }
  };

  return (
    <section className="relative min-h-screen w-full bg-bg flex flex-col justify-between pt-20 md:pt-24 overflow-visible" style={{ background: "#0a0a0a" }}>
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-grid opacity-[0.2] pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto flex flex-col-reverse md:flex-row items-center md:items-stretch px-4 md:px-0 relative">
        
        {/* LEFT SIDE (45% width) */}
        <div className="w-full md:w-[45%] flex flex-col justify-center py-12 md:py-0 text-left relative z-[1] overflow-visible" style={{ minHeight: "auto" }}>

          {/* Main Heading */}
          <h1 
            ref={solidH1Ref}
            className="font-syne font-extrabold text-[clamp(2.2rem,9.2vw,4rem)] md:text-[clamp(3.5rem,8vw,7rem)] leading-[0.95] tracking-tight uppercase flex flex-col cursor-default select-none relative w-full"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              "--mouse-x": "0px",
              "--mouse-y": "0px",
              "--spotlight-radius": "0px",
            } as React.CSSProperties}
          >
            <span className="text-text-primary block">
              ENGINEER
            </span>
            <span className="text-text-primary block">
              <span className="md:inline block">BY</span>{" "}
              <span className="md:inline block">LOGIC.</span>
            </span>
            <span className="pl-0 md:pl-12 text-amber block">
              DESIGNER
            </span>
            <span className="pl-0 md:pl-12 text-amber block">
              <span className="md:inline block">BY</span>{" "}
              <span className="md:inline block">OBSESSION.</span>
            </span>

            {/* Hover Spotlight: Stroke Text */}
            <span 
              className="absolute inset-0 flex flex-col pointer-events-none"
              style={{
                maskImage: "radial-gradient(circle var(--spotlight-radius) at var(--mouse-x) var(--mouse-y), black 80%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(circle var(--spotlight-radius) at var(--mouse-x) var(--mouse-y), black 80%, transparent 100%)",
              }}
            >
              <span style={{ WebkitTextStroke: "3.5px var(--text-primary)", WebkitTextFillColor: "transparent", color: "transparent" } as React.CSSProperties} className="block">
                ENGINEER
              </span>
              <span style={{ WebkitTextStroke: "3.5px var(--text-primary)", WebkitTextFillColor: "transparent", color: "transparent" } as React.CSSProperties} className="block">
                <span className="md:inline block">BY</span>{" "}
                <span className="md:inline block">LOGIC.</span>
              </span>
              <span className="pl-0 md:pl-12 block" style={{ WebkitTextStroke: "3.5px var(--amber)", WebkitTextFillColor: "transparent", color: "transparent" } as React.CSSProperties}>
                DESIGNER
              </span>
              <span className="pl-0 md:pl-12 block" style={{ WebkitTextStroke: "3.5px var(--amber)", WebkitTextFillColor: "transparent", color: "transparent" } as React.CSSProperties}>
                <span className="md:inline block">BY</span>{" "}
                <span className="md:inline block">OBSESSION.</span>
              </span>
            </span>
          </h1>

          {/* Name & Border Line */}
          <div className="mt-8 pl-3 border-l-[3px] border-amber">
            <span className="font-inter font-medium text-[14px] text-text-muted tracking-[0.1em]">
              — {siteName || "Hanan Bhatti"}
            </span>
          </div>

          {/* Tagline */}
          <p className="mt-4 font-inter font-normal text-[15px] text-text-muted leading-[1.7] max-w-[380px]">
            {heroTagline || "Engineer by logic. Designer by obsession."}
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap gap-4 items-center">
            <Link
              href="/projects"
              className="inline-flex items-center justify-center font-inter font-semibold text-[14px] bg-amber text-black px-7 py-3.5 transition-all active:scale-[0.98] select-none uppercase hover:bg-amber/90 whitespace-nowrap min-w-[140px] flex-shrink-0"
            >
              Explore Work →
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center font-inter font-semibold text-[14px] border border-border bg-transparent text-text-primary px-7 py-3.5 transition-all hover:border-green hover:text-green select-none uppercase whitespace-nowrap min-w-[140px] flex-shrink-0"
            >
              Contact Me
            </Link>
          </div>

          {/* Social Links */}
          <div className="mt-4 flex items-center gap-6">
            {socialGithub && (
              <a
                href={socialGithub}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6B7280] hover:text-[#F59E0B] transition-colors cursor-pointer w-5 h-5 flex items-center justify-center"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            )}
            {socialGithub && socialLinkedin && <span className="h-1.5 w-1.5 rounded-full bg-green opacity-50" />}
            {socialLinkedin && (
              <a
                href={socialLinkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6B7280] hover:text-[#F59E0B] transition-colors cursor-pointer w-5 h-5 flex items-center justify-center"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
            )}
            {socialLinkedin && socialTwitter && <span className="h-1.5 w-1.5 rounded-full bg-green opacity-50" />}
            {socialTwitter && (
              <a
                href={socialTwitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6B7280] hover:text-[#F59E0B] transition-colors cursor-pointer w-5 h-5 flex items-center justify-center"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
          </div>

        </div>

        {/* RIGHT SIDE (55% width) */}
        <div className="w-full md:w-[55%] h-[40vh] md:h-auto md:min-h-[600px] lg:min-h-[750px] relative flex items-end justify-center overflow-hidden z-[2]">
          
          {/* Large decorative logo */}
          <div className="absolute top-[-2rem] right-[-2rem] z-0 select-none pointer-events-none opacity-[0.02] w-[20vw] h-[20vw]">
            <img src="/logo.svg" alt="" className="w-full h-full object-contain" />
          </div>

          {/* Hero Photo */}
          {heroPhotoUrl && (
            <div className="relative md:absolute md:right-0 md:bottom-0 w-full h-[40vh] md:h-full z-[2]">
              <HeroPhoto src={heroPhotoUrl} alt={siteName || "Hanan Bhatti"} />
            </div>
          )}

          {/* Amber Rectangle Accent */}
          <div className="absolute bottom-[15%] right-[8%] w-[6px] h-[80px] bg-amber z-20 hidden md:block" />

          {/* Green Rectangle Accent */}
          <div className="absolute top-[20%] right-[15%] w-[6px] h-[40px] bg-green z-20 hidden md:block" />

        </div>

        {/* Dynamic Stroke Text Overlay for perfect masking effect */}
        {heroPhotoUrl && (
          <div className="absolute inset-0 pointer-events-none z-[10] overflow-hidden hidden md:block">
            <div 
              className="absolute right-0 bottom-0 w-[55%] h-full"
              style={{
                WebkitMaskImage: `url(${heroPhotoUrl})`,
                maskImage: `url(${heroPhotoUrl})`,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskPosition: "bottom right",
                maskPosition: "bottom right",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
              }}
            >
              <div className="absolute left-[-81.82%] top-0 w-[181.82%] h-full">
                <div className="w-[45%] flex flex-col justify-center py-12 md:py-0 text-left h-full" style={{ minHeight: "auto" }}>
                  <div 
                    ref={strokeH1Ref}
                    className="font-syne font-extrabold text-[clamp(2.2rem,9.2vw,4rem)] md:text-[clamp(3.5rem,8vw,7rem)] leading-[0.95] tracking-tight uppercase flex flex-col relative w-full"
                    style={{
                      "--mouse-x": "0px",
                      "--mouse-y": "0px",
                      "--spotlight-radius": "0px",
                    } as React.CSSProperties}
                  >
                    {/* Normal: Stroke Text */}
                    <span style={{ WebkitTextStroke: "3.5px var(--text-primary)", WebkitTextFillColor: "transparent", color: "transparent" } as React.CSSProperties} className="block">
                      ENGINEER
                    </span>
                    <span style={{ WebkitTextStroke: "3.5px var(--text-primary)", WebkitTextFillColor: "transparent", color: "transparent" } as React.CSSProperties} className="block">
                      <span className="md:inline block">BY</span>{" "}
                      <span className="md:inline block">LOGIC.</span>
                    </span>
                    <span className="pl-0 md:pl-12 block" style={{ WebkitTextStroke: "3.5px var(--amber)", WebkitTextFillColor: "transparent", color: "transparent" } as React.CSSProperties}>
                      DESIGNER
                    </span>
                    <span className="pl-0 md:pl-12 block" style={{ WebkitTextStroke: "3.5px var(--amber)", WebkitTextFillColor: "transparent", color: "transparent" } as React.CSSProperties}>
                      <span className="md:inline block">BY</span>{" "}
                      <span className="md:inline block">OBSESSION.</span>
                    </span>

                    {/* Hover Spotlight: Solid Text */}
                    <span 
                      className="absolute inset-0 flex flex-col pointer-events-none"
                      style={{
                        maskImage: "radial-gradient(circle var(--spotlight-radius) at var(--mouse-x) var(--mouse-y), black 80%, transparent 100%)",
                        WebkitMaskImage: "radial-gradient(circle var(--spotlight-radius) at var(--mouse-x) var(--mouse-y), black 80%, transparent 100%)",
                      }}
                    >
                      <span className="text-text-primary block">
                        ENGINEER
                      </span>
                      <span className="text-text-primary block">
                        <span className="md:inline block">BY</span>{" "}
                        <span className="md:inline block">LOGIC.</span>
                      </span>
                      <span className="pl-0 md:pl-12 text-amber block">
                        DESIGNER
                      </span>
                      <span className="pl-0 md:pl-12 text-amber block">
                        <span className="md:inline block">BY</span>{" "}
                        <span className="md:inline block">OBSESSION.</span>
                      </span>
                    </span>
                  </div>

                  {/* Replicated other elements with invisible/opacity-0 to match flex spacing exactly */}
                  <div className="mt-8 pl-3 border-l-[3px] border-transparent invisible" aria-hidden="true">
                    <span className="font-inter font-medium text-[14px] tracking-[0.1em]">
                      — {siteName || "Hanan Bhatti"}
                    </span>
                  </div>
                  <p className="mt-4 font-inter font-normal text-[15px] leading-[1.7] max-w-[380px] invisible" aria-hidden="true">
                    {heroTagline || "Engineer by logic. Designer by obsession."}
                  </p>
                  <div className="mt-10 flex flex-wrap gap-4 items-center invisible" aria-hidden="true">
                    <div className="inline-flex items-center justify-center font-inter font-semibold text-[14px] px-7 py-3.5 uppercase whitespace-nowrap min-w-[140px] flex-shrink-0">
                      Explore Work →
                    </div>
                    <div className="inline-flex items-center justify-center font-inter font-semibold text-[14px] px-7 py-3.5 uppercase whitespace-nowrap min-w-[140px] flex-shrink-0">
                      Contact Me
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-6 invisible" aria-hidden="true">
                    {socialGithub && (
                      <div className="w-5 h-5 flex items-center justify-center">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" />
                      </div>
                    )}
                    {socialGithub && socialLinkedin && <span className="h-1.5 w-1.5 rounded-full" />}
                    {socialLinkedin && (
                      <div className="w-5 h-5 flex items-center justify-center">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" />
                      </div>
                    )}
                    {socialLinkedin && socialTwitter && <span className="h-1.5 w-1.5 rounded-full" />}
                    {socialTwitter && (
                      <div className="w-5 h-5 flex items-center justify-center">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
