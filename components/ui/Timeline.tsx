"use client";

import { motion } from "framer-motion";
import { cn, formatDate } from "@/lib/utils";

export interface TimelineEntry {
  id: string;
  role: string;
  company: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
}

export default function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <div className="relative mx-auto max-w-3xl">
      <motion.div
        className="absolute top-0 left-4 w-0.5 bg-gradient-to-b from-indigo-accent to-cyan-accent md:left-1/2 md:-translate-x-1/2"
        initial={{ height: 0 }}
        whileInView={{ height: "100%" }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      <ul className="space-y-10">
        {entries.map((entry, i) => (
          <motion.li
            key={entry.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className={cn(
              "relative pl-12 md:w-1/2 md:pl-0",
              i % 2 === 0 ? "md:pr-10 md:text-right" : "md:ml-auto md:pl-10"
            )}
          >
            <span
              className={cn(
                "glow-cyan absolute top-1 left-2.5 h-3.5 w-3.5 rounded-full bg-cyan-accent",
                i % 2 === 0 ? "md:-right-[7px] md:left-auto" : "md:-left-[7px]"
              )}
            />
            <div className="glass rounded-2xl p-5">
              <h3 className="font-semibold text-white">{entry.role}</h3>
              <p className="text-sm text-cyan-accent">
                {entry.company}
                {entry.location ? ` · ${entry.location}` : ""}
              </p>
              <p className="mt-1 font-mono text-xs text-zinc-500">
                {formatDate(entry.startDate)} — {entry.current ? "Present" : entry.endDate ? formatDate(entry.endDate) : ""}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{entry.description}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
