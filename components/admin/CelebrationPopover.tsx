"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { FiAward, FiCheck } from "react-icons/fi";
import { getCelebrationsAction, markCelebratedAction } from "@/lib/actions";

interface CelebrationPopoverProps {
  type: "post" | "project" | "photo" | "skill" | "experience";
  count: number;
}

const MESSAGES = {
  post: {
    title: "First Blog Post Published! ✍️",
    desc: "Incredible work! Your thoughts, tutorials, and insights are now live on your portfolio blog. You've officially started your writer journey.",
  },
  project: {
    title: "First Project Added! 🚀",
    desc: "Outstanding! You've documented your first engineering project. Showcase your capabilities, source repository, and live demos to visitors.",
  },
  photo: {
    title: "First Photograph Shared! 📸",
    desc: "Beautiful capture! Your photography gallery has its very first piece. Share your unique visual perspective and creative eye.",
  },
  skill: {
    title: "First Skill Documented! 🛠️",
    desc: "Great start! You've updated your technical toolbox. Let visitors and recruiters know exactly which stacks and technologies you excel in.",
  },
  experience: {
    title: "First Career Milestone! 💼",
    desc: "Congratulations! Your professional resume timeline is shaping up. Documenting your experience highlights your career journey and achievements.",
  },
};

export default function CelebrationPopover({ type, count }: CelebrationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (count !== 1) return;

    const checkCelebration = async () => {
      try {
        const status = await getCelebrationsAction();
        if ("error" in status) return;

        const fieldMap = {
          post: "celebratedPost",
          project: "celebratedProject",
          photo: "celebratedPhoto",
          skill: "celebratedSkill",
          experience: "celebratedExperience",
        } as const;

        const wasCelebrated = status[fieldMap[type]];

        if (!wasCelebrated) {
          // Immediately mark as celebrated in the database so it never runs again
          await markCelebratedAction(type);

          // Trigger Confetti Celebration!
          const duration = 2.5 * 1000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 9999 };

          const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

          const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
              return clearInterval(interval);
            }

            const particleCount = 40 * (timeLeft / duration);
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            });
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            });
          }, 250);

          // Open Modal Popover after a brief delay
          const openTimeout = setTimeout(() => {
            setIsOpen(true);
          }, 300);

          return () => {
            clearInterval(interval);
            clearTimeout(openTimeout);
          };
        }
      } catch (err) {
        console.error("Celebration check failed", err);
      }
    };

    checkCelebration();
  }, [type, count]);

  const activeMsg = MESSAGES[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          {/* Backdrop Click Dismissal */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-md border border-[#262626] bg-[#0c0c0c] p-6 shadow-2xl rounded-none text-center"
          >
            {/* Celebration Icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-amber bg-amber/10 text-amber">
              <FiAward className="h-7 w-7 animate-bounce" />
            </div>

            {/* Congratulation details */}
            <h3 className="mb-2 font-mono text-base font-bold uppercase tracking-wider text-white">
              {activeMsg.title}
            </h3>
            <p className="mb-6 font-mono text-xs leading-relaxed text-zinc-400">
              {activeMsg.desc}
            </p>

            {/* Action buttons */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 rounded-none bg-amber border border-amber px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-black hover:bg-amber/90 transition-colors cursor-pointer"
            >
              <FiCheck className="h-4 w-4" />
              Awesome, thanks!
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
