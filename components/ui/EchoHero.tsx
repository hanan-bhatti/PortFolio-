"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./EchoHero.module.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const WORD = "ABOUT ME";
const TOP_ROWS = ["ink", "accent", "ink"] as const;
const BOTTOM_ROWS = ["ink", "accent", "ink"] as const;

export default function EchoHero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const echoes = gsap.utils.toArray<HTMLElement>("[data-echo]", section);
      const cells = gsap.utils.toArray<HTMLElement>("[data-echo-cell]", section);
      const solidRow = section.querySelector<HTMLElement>('[data-band="solid"]');

      const cellDy = (cell: HTMLElement) => {
        const row = cell.querySelector<HTMLElement>("[data-echo]");
        if (!row || !solidRow) return 0;
        return (
          solidRow.offsetTop +
          solidRow.offsetHeight / 2 -
          (row.offsetTop + row.offsetHeight / 2)
        );
      };

      gsap.set("[data-solid]", { yPercent: 115 });
      gsap.set(cells, {
        y: (_i: number, el: HTMLElement) => cellDy(el),
        clipPath: (_i: number, el: HTMLElement) =>
          el.dataset.dir === "up"
            ? "inset(0% 0% 100% 0%)"
            : "inset(100% 0% 0% 0%)",
      });

      const intro = gsap.timeline({ delay: 0.1 });
      intro
        .to("[data-solid]", { yPercent: 0, duration: 1, ease: "expo.out" })
        .to(
          cells,
          {
            y: 0,
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.9,
            ease: "power3.out",
            onComplete: () => {
              gsap.set(cells, { clearProps: "clipPath,transform" });
              merge.scrollTrigger?.refresh();
            },
          },
          "-=0.65"
        );

      const merge = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=120%",
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      merge.fromTo(
        echoes,
        { clipPath: "inset(0% 0% 0% 0%)", y: 0 },
        {
          clipPath: (_i: number, el: HTMLElement) =>
            el.dataset.dir === "up"
              ? "inset(0% 0% 100% 0%)"
              : "inset(100% 0% 0% 0%)",
          y: (_i: number, el: HTMLElement) =>
            solidRow
              ? solidRow.offsetTop +
                solidRow.offsetHeight / 2 -
                (el.offsetTop + el.offsetHeight / 2)
              : 0,
          ease: "power1.in",
          duration: 1,
          immediateRender: false,
        },
        0
      );

      return () => {
        intro.kill();
        merge.scrollTrigger?.kill();
        merge.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.hero}>
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.stack}>
          <div className={styles.echoGroup} data-group="top">
            {TOP_ROWS.map((tone, i) => (
              <div
                key={`t${i}`}
                className={styles.echoCell}
                data-echo-cell
                data-dir="up"
              >
                <div
                  className={`${styles.echoRow} ${styles[tone]}`}
                  data-band="top"
                  data-echo
                  data-dir="up"
                >
                  <span className={styles.echoText}>{WORD}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.solid} data-band="solid">
            <span className={styles.solidText} data-solid>
              <span className={styles.solidInk}>ABOUT</span>{" "}
              <span className={styles.solidAccent}>ME</span>
            </span>
          </div>

          <div className={styles.echoGroup} data-group="bottom">
            {BOTTOM_ROWS.map((tone, i) => (
              <div
                key={`b${i}`}
                className={styles.echoCell}
                data-echo-cell
                data-dir="down"
              >
                <div
                  className={`${styles.echoRow} ${styles[tone]}`}
                  data-band="bottom"
                  data-echo
                  data-dir="down"
                >
                  <span className={styles.echoText}>{WORD}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
