"use client";

import { useEffect, useState } from "react";
import { initAnalytics } from "@/lib/analytics";

interface CookieBannerProps {
  text: string;
}

export default function CookieBanner({ text }: CookieBannerProps) {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Check if 'cookie_consent' cookie exists
    const consent = getCookie("cookie_consent");
    if (consent) {
      if (consent === "all") {
        initAnalytics();
      } else {
        initAnalytics();
      }
    } else {
      // 2. Show banner after 1s delay
      const timer = setTimeout(() => {
        setMounted(true);
        // Trigger animation
        setTimeout(() => setShow(true), 50);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (type: "essential" | "all") => {
    setCookie("cookie_consent", type, 365);
    setShow(false);
    
    // Always initialize analytics, it will read the new cookie
    initAnalytics();

    // Unmount after animation finishes (0.2s)
    setTimeout(() => {
      setMounted(false);
    }, 200);
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        zIndex: 9998,
        transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
        transform: show ? "translateY(0)" : "translateY(100%)",
        opacity: show ? 1 : 0,
      }}
      className="fixed bottom-0 left-0 right-0 border-t border-[#262626] bg-[#1a1a1a] px-[max(2rem,5vw)] py-5"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        {/* Left text */}
        <p className="max-w-xl font-sans text-[13px] leading-relaxed text-[#6B7280]">
          {text}{" "}
          <a href="/privacy" className="font-medium text-[#F59E0B] underline hover:text-white transition-colors">
            Privacy Policy
          </a>{" "}
          and{" "}
          <a href="/terms" className="font-medium text-[#F59E0B] underline hover:text-white transition-colors">
            Terms of Service
          </a>
          .
        </p>

        {/* Right buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleConsent("essential")}
            className="border border-[#262626] px-5 py-2 text-xs font-medium text-[#6B7280] transition-colors hover:border-[#6B7280] hover:text-white cursor-pointer"
          >
            Essential Only
          </button>
          <button
            onClick={() => handleConsent("all")}
            className="bg-[#F59E0B] px-5 py-2 text-xs font-semibold text-black transition-colors hover:bg-white cursor-pointer"
          >
            Allow All
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper functions for cookies
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    if (!c) continue;
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function setCookie(name: string, value: string, days: number) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}
