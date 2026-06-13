"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const LiquidNavbarBackground = dynamic(() => import("../3d/LiquidNavbarBackground"), {
  ssr: false,
  loading: () => null,
});

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeTabRect, setActiveTabRect] = useState<{ left: number; width: number } | null>(null);
  const [navbarSize, setNavbarSize] = useState({ width: 0, height: 0 });

  const navRef = useRef<HTMLElement>(null);

  // ResizeObserver to track container dimensions and active tab coordinates dynamically
  useEffect(() => {
    const updateDimensions = () => {
      const nav = navRef.current;
      if (!nav) return;

      // Update navbar dimensions in state
      setNavbarSize({
        width: nav.clientWidth,
        height: nav.clientHeight,
      });

      // Find the currently active link element (desktop menu)
      const activeEl = nav.querySelector(`[data-active="true"]`) as HTMLElement;
      if (activeEl) {
        const navRect = nav.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        
        setActiveTabRect({
          left: activeRect.left - navRect.left,
          width: activeRect.width,
        });
      } else {
        setActiveTabRect(null);
      }
    };

    // Run initial calculation
    updateDimensions();

    // Observe navbar container resizing (responsive layout changes)
    const observer = new ResizeObserver(updateDimensions);
    if (navRef.current) {
      observer.observe(navRef.current);
    }

    window.addEventListener("resize", updateDimensions);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 md:px-0">
      <nav
        ref={navRef}
        className="relative mx-auto mt-4 flex max-w-5xl items-center justify-between rounded-2xl px-5 py-3 overflow-hidden select-none border border-white/[0.03]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* CSS Backdrop Blur Layer for background content */}
        <div className="absolute inset-0 -z-20 bg-white/[0.01] backdrop-blur-[14px] rounded-2xl" />

        {/* WebGL Liquid Glass Background Canvas */}
        <LiquidNavbarBackground
          activeTabRect={activeTabRect}
          isHovered={isHovered}
          navbarWidth={navbarSize.width}
          navbarHeight={navbarSize.height}
        />

        <Link
          href="/"
          className="relative z-10 font-mono text-lg font-bold gradient-text transition-transform hover:scale-105 active:scale-95"
        >
          HB
        </Link>
        
        <ul className="hidden items-center gap-1 md:flex relative z-10">
          {LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  data-active={isActive}
                  className={cn(
                    "relative z-10 block rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-accent",
                    isActive 
                      ? "text-zinc-950 dark:text-zinc-50" 
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="relative z-10 p-2 md:hidden rounded-lg hover:bg-white/5 active:scale-95 transition-all"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg
              className="h-6 w-6 text-zinc-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <div className="space-y-1.5">
              <span className="block h-0.5 w-6 bg-zinc-200 transition-all" />
              <span className="block h-0.5 w-6 bg-zinc-200 transition-all" />
              <span className="block h-0.5 w-6 bg-zinc-200 transition-all" />
            </div>
          )}
        </button>
      </nav>

      {/* Mobile drop-down menu */}
      {open && (
        <ul className="glass mx-4 mt-2 space-y-1 rounded-2xl p-4 md:hidden relative z-50">
          {LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-98",
                    isActive 
                      ? "bg-cyan-accent/10 text-cyan-accent border border-cyan-accent/20" 
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </header>
  );
}
