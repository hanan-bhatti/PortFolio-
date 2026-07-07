"use client";

import { useEffect } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollAnimations() {
  useEffect(() => {
    // We use a MutationObserver to apply animations only after elements are added
    // and we wait for the window load event to ensure hydration is generally complete.
    let ctx: gsap.Context;
    
    const initAnimations = () => {
      ctx = gsap.context(() => {
        const sections = document.querySelectorAll("section");
        sections.forEach((section) => {
          // Avoid targeting elements inside Suspense boundaries before they hydrate
          // by using a more specific selector if possible, or just adding a small delay.
          const elementsToAnimate = section.querySelectorAll("h2:not(.no-anim), h3:not(.no-anim), p:not(.no-anim), .card, .project-card, .skill-item");

          if (elementsToAnimate.length > 0) {
            gsap.fromTo(
              elementsToAnimate,
              { 
                y: 50, 
                opacity: 0 
              },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: section,
                  start: "top 80%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }
        });
      });
    };

    // Use a longer delay to ensure streaming Suspense boundaries have hydrated
    const timeout = setTimeout(() => {
      if (document.readyState === "complete") {
        initAnimations();
      } else {
        window.addEventListener("load", initAnimations);
      }
    }, 500);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("load", initAnimations);
      if (ctx) ctx.revert(); // Revert cleans up all inline styles applied by GSAP!
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return null;
}
