"use client";

import { motion } from "framer-motion";

export default function RadialSkill({ name, level }: { name: string; level: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className="glass flex flex-col items-center gap-2 rounded-2xl p-4 transition-transform duration-300 [transform-style:preserve-3d] hover:[transform:perspective(600px)_rotateX(6deg)_rotateY(-6deg)]"
    >
      <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
        <circle cx="38" cy="38" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <motion.circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          stroke="url(#skill-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * (1 - level / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="skill-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-sm font-medium text-zinc-200">{name}</span>
      <span className="font-mono text-xs text-zinc-500">{level}%</span>
    </div>
  );
}
