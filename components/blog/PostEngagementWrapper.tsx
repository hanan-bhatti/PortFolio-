"use client";

/**
 * @file components/blog/PostEngagementWrapper.tsx
 * @description Unified client component wrapper for blog post engagements. Manages reactions, ratings, survey forms, notification requests, exit intent, and passive tracking.
 * 
 * @exports
 * - PostEngagementWrapper (default): Main React component for managing post engagements
 */

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { initAnalytics, getVisitorId } from "@/lib/analytics";
import BlogContentClient from "./BlogContentClient";

interface EngagementConfig {
  emojiReactionsOn: boolean;
  helpfulVoteOn: boolean;
  starRatingOn: boolean;
  sectionReactionsOn: boolean;
  endSurveyOn: boolean;
  difficultyToggleOn: boolean;
  exitIntentOn: boolean;
  notifyMeOn: boolean;
}

interface EngagementSummary {
  emojiSummary: Record<string, number>;
  helpful: { yes: number; no: number };
  rating: { average: number; total: number };
  sectionSummary: Record<string, Record<string, number>>;
}

interface VisitorState {
  myEmojis: string[];
  myHelpful: boolean | null;
  myRating: number | null;
  mySectionReactions: Record<string, string[]>;
}

interface Props {
  postId: string;
  html: string;
  config: EngagementConfig;
  initialSummary: EngagementSummary;
}

export default function PostEngagementWrapper({
  postId,
  html,
  config,
  initialSummary,
}: Props) {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [summary, setSummary] = useState<EngagementSummary>(initialSummary);
  const [visitor, setVisitor] = useState<VisitorState | null>(null);

  // Popover state for section reactions
  const [popoverState, setPopoverState] = useState<{
    sectionId: string;
    rect: DOMRect;
  } | null>(null);

  // Exit intent states
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitTab, setExitTab] = useState<"notify" | "survey">("notify");
  const isScrollPast80 = useRef(false);

  // Local interaction states
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const hasPlaceholder = (type: string) => new RegExp(`data-widget=["']${type}["']`).test(html);

  const [isPending, startTransition] = useTransition();

  // Passive analytics queue
  const eventQueue = useRef<{ eventType: string; value?: string | null; visitorId: string }[]>([]);
  const isFlushing = useRef(false);
  const utmAttribution = useRef({
    source: null as string | null,
    medium: null as string | null,
    campaign: null as string | null,
  });

  // Load visitor ID and get actual summary counts + visitor states from DB
  useEffect(() => {
    async function loadVisitorData() {
      const vid = await initAnalytics();
      setVisitorId(vid);

      // UTM Attribution from sessionStorage
      try {
        const cached = sessionStorage.getItem("utm_attribution");
        if (cached) {
          const parsed = JSON.parse(cached);
          utmAttribution.current = {
            source: parsed.source || null,
            medium: parsed.medium || null,
            campaign: parsed.campaign || null,
          };
        }
      } catch {
        // ignore
      }

      // If no utm cache, check URL parameters
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("utm_source")) {
          utmAttribution.current = {
            source: params.get("utm_source"),
            medium: params.get("utm_medium"),
            campaign: params.get("utm_campaign"),
          };
        }
      }

      // Fetch dynamic live metrics + visitor status
      try {
        const url = `/api/posts/${postId}/reactions/summary${vid ? `?visitorId=${vid}` : ""}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setSummary({
            emojiSummary: data.emojiSummary || {},
            helpful: data.helpful || { yes: 0, no: 0 },
            rating: data.rating || { average: 0, total: 0 },
            sectionSummary: data.sectionSummary || {},
          });
          if (data.visitor) {
            setVisitor(data.visitor);
          }
        }
      } catch (err) {
        console.error("Failed to load engagement summary", err);
      }
    }

    loadVisitorData();
  }, [postId]);

  // Queue background passive analytics events
  const queueEvent = useCallback((eventType: string, value?: string | null) => {
    const vid = visitorId || getVisitorId();
    if (!vid) return;

    // Deduplicate event logs in active memory if they match exactly
    const exists = eventQueue.current.some(
      (e) => e.eventType === eventType && e.value === value
    );
    if (exists) return;

    eventQueue.current.push({
      visitorId: vid,
      eventType,
      value: value || null,
    });
  }, [visitorId]);

  const flushEvents = useCallback(async () => {
    if (eventQueue.current.length === 0 || isFlushing.current) return;
    isFlushing.current = true;
    const batch = [...eventQueue.current];
    eventQueue.current = [];

    // Inject referral/UTM parameters to each event row
    const payload = batch.map((evt) => ({
      ...evt,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      utmSource: utmAttribution.current.source,
      utmMedium: utmAttribution.current.medium,
      utmCampaign: utmAttribution.current.campaign,
    }));

    try {
      await fetch(`/api/posts/${postId}/analytics/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Re-queue on request failure
      eventQueue.current = [...batch, ...eventQueue.current];
    } finally {
      isFlushing.current = false;
    }
  }, [postId]);

  // Passive logging intervals & Visibility hooks
  useEffect(() => {
    // Log initial page load / bounce benchmark state
    queueEvent("bounce", "entered");

    const timer = setInterval(() => {
      flushEvents();
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, [visitorId, queueEvent, flushEvents]);

  // Time on page active ticks (records only active window exposure)
  const activeTime = useRef(0);
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") {
        activeTime.current += 1;
        
        // Log "explored" event once user exceeds 30 seconds of active reading
        if (activeTime.current === 30) {
          queueEvent("explored", "active_reading");
        }
      }
    };

    const timeInterval = setInterval(tick, 1000);

    const handleExit = () => {
      if (activeTime.current > 0) {
        queueEvent("time_on_page", activeTime.current.toString());
      }

      if (eventQueue.current.length > 0) {
        const url = `/api/posts/${postId}/analytics/event`;
        const payload = JSON.stringify(
          eventQueue.current.map((evt) => ({
            ...evt,
            referrer: document.referrer || null,
            utmSource: utmAttribution.current.source,
            utmMedium: utmAttribution.current.medium,
            utmCampaign: utmAttribution.current.campaign,
          }))
        );
        eventQueue.current = [];

        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon(url, blob);
        } else {
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleExit();
      }
    };

    window.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", handleExit);
    window.addEventListener("beforeunload", handleExit);

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", handleExit);
      window.removeEventListener("beforeunload", handleExit);
      handleExit();
    };
  }, [postId, visitorId, queueEvent]);

  // Scroll depth checkpoints listener
  useEffect(() => {
    const triggeredCheckpoints = new Set<number>();

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);

      const checkAndTrigger = (threshold: number) => {
        if (scrollPercent >= threshold && !triggeredCheckpoints.has(threshold)) {
          triggeredCheckpoints.add(threshold);
          queueEvent("scroll_depth", threshold.toString());

          if (threshold === 50) {
            queueEvent("explored", "scrolled_deep");
          }
          if (threshold >= 80) {
            isScrollPast80.current = true;
          }
        }
      };

      checkAndTrigger(25);
      checkAndTrigger(50);
      checkAndTrigger(75);
      checkAndTrigger(100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [visitorId, queueEvent]);

  // Exit intent trigger hook (desktop-only mouse exit listener)
  useEffect(() => {
    if (!config.exitIntentOn) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger only if mouse exits viewport top, scroll is deep, and popup wasn't shown yet
      if (
        e.clientY <= 20 &&
        isScrollPast80.current &&
        !localStorage.getItem(`exitIntentShown-${postId}`)
      ) {
        localStorage.setItem(`exitIntentShown-${postId}`, "true");
        setShowExitIntent(true);
        queueEvent("exit_intent_shown", "trigger");
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [config.exitIntentOn, postId, visitorId, queueEvent]);

  // Track code copies from BlogContentClient
  const handleCopyEvent = (codeBlockId: string) => {
    queueEvent("copy_event", codeBlockId);
  };

  // Toggle Emoji Reactions
  const handleEmojiReact = async (emoji: string) => {
    const vid = visitorId || getVisitorId();
    if (!vid) {
      toast.error("Unable to identify reader session.");
      return;
    }

    const previousEmojis = visitor?.myEmojis || [];
    const hasReacted = previousEmojis.includes(emoji);
    
    // Optimistic UI updates
    setVisitor((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        myEmojis: hasReacted ? [] : [emoji],
      };
    });

    setSummary((prev) => {
      const nextEmojiSummary = { ...prev.emojiSummary };
      
      // 1. Decrement previously selected emojis
      previousEmojis.forEach((prevEmoji) => {
        if (nextEmojiSummary[prevEmoji]) {
          nextEmojiSummary[prevEmoji] = Math.max(0, nextEmojiSummary[prevEmoji] - 1);
        }
      });

      // 2. Increment newly selected emoji if we did not just deselect it
      if (!hasReacted) {
        nextEmojiSummary[emoji] = (nextEmojiSummary[emoji] || 0) + 1;
      }

      return {
        ...prev,
        emojiSummary: nextEmojiSummary,
      };
    });

    try {
      const method = hasReacted ? "DELETE" : "POST";
      const res = await fetch(`/api/posts/${postId}/reactions/emoji`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: vid, emoji }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Reaction failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update reaction");
      // Rollback optimistic state on error
      setVisitor((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          myEmojis: previousEmojis,
        };
      });
      setSummary((prev) => {
        const rollbackSummary = { ...prev.emojiSummary };
        
        // Remove current optimistic emoji
        if (!hasReacted) {
          rollbackSummary[emoji] = Math.max(0, (rollbackSummary[emoji] || 0) - 1);
        }
        
        // Restore previous emojis
        previousEmojis.forEach((prevEmoji) => {
          rollbackSummary[prevEmoji] = (rollbackSummary[prevEmoji] || 0) + 1;
        });

        return {
          ...prev,
          emojiSummary: rollbackSummary,
        };
      });
    }
  };

  // Submit Helpfulness Vote
  const handleHelpfulVote = async (helpful: boolean) => {
    const vid = visitorId || getVisitorId();
    if (!vid) return;

    const previousVote = visitor?.myHelpful ?? null;

    // Optimistic UI Updates
    setVisitor((prev) => (prev ? { ...prev, myHelpful: helpful } : null));
    setSummary((prev) => {
      let yesDiff = 0;
      let noDiff = 0;

      if (previousVote === null) {
        if (helpful) yesDiff = 1;
        else noDiff = 1;
      } else if (previousVote !== helpful) {
        if (helpful) {
          yesDiff = 1;
          noDiff = -1;
        } else {
          yesDiff = -1;
          noDiff = 1;
        }
      }

      return {
        ...prev,
        helpful: {
          yes: Math.max(0, prev.helpful.yes + yesDiff),
          no: Math.max(0, prev.helpful.no + noDiff),
        },
      };
    });

    try {
      const res = await fetch(`/api/posts/${postId}/reactions/helpful`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: vid, helpful }),
      });
      if (!res.ok) throw new Error("Vote failed");
      toast.success("Vote registered!");
    } catch {
      toast.error("Failed to register vote");
      // Rollback
      setVisitor((prev) => (prev ? { ...prev, myHelpful: previousVote } : null));
      setSummary((prev) => {
        let yesDiff = 0;
        let noDiff = 0;

        if (previousVote === null) {
          if (helpful) yesDiff = -1;
          else noDiff = -1;
        } else if (previousVote !== helpful) {
          if (helpful) {
            yesDiff = -1;
            noDiff = 1;
          } else {
            yesDiff = 1;
            noDiff = -1;
          }
        }

        return {
          ...prev,
          helpful: {
            yes: Math.max(0, prev.helpful.yes + yesDiff),
            no: Math.max(0, prev.helpful.no + noDiff),
          },
        };
      });
    }
  };

  // Submit Star Rating
  const handleStarRating = async (rating: number) => {
    const vid = visitorId || getVisitorId();
    if (!vid) return;

    const previousRating = visitor?.myRating ?? null;

    // Optimistic UI updates
    setVisitor((prev) => (prev ? { ...prev, myRating: rating } : null));
    setSummary((prev) => {
      const isNew = previousRating === null;
      const newTotal = isNew ? prev.rating.total + 1 : prev.rating.total;
      
      const currentSum = prev.rating.average * prev.rating.total;
      const newSum = isNew
        ? currentSum + rating
        : currentSum - (previousRating || 0) + rating;
      
      const newAvg = newTotal > 0 ? parseFloat((newSum / newTotal).toFixed(1)) : 0;

      return {
        ...prev,
        rating: { average: newAvg, total: newTotal },
      };
    });

    try {
      const res = await fetch(`/api/posts/${postId}/reactions/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: vid, rating }),
      });
      if (!res.ok) throw new Error("Rating failed");
      toast.success(`Rated ${rating} stars!`);
    } catch {
      toast.error("Failed to submit rating");
      // Rollback
      setVisitor((prev) => (prev ? { ...prev, myRating: previousRating } : null));
      setSummary((prev) => {
        const isNew = previousRating === null;
        const oldTotal = isNew ? Math.max(0, prev.rating.total - 1) : prev.rating.total;
        
        const currentSum = prev.rating.average * prev.rating.total;
        const oldSum = isNew
          ? currentSum - rating
          : currentSum - rating + (previousRating || 0);

        const oldAvg = oldTotal > 0 ? parseFloat((oldSum / oldTotal).toFixed(1)) : 0;

        return {
          ...prev,
          rating: { average: oldAvg, total: oldTotal },
        };
      });
    }
  };

  // Toggle Section Reactions
  const handleSectionReact = async (sectionId: string, emoji: string) => {
    const vid = visitorId || getVisitorId();
    if (!vid) return;

    const sectionMyList = visitor?.mySectionReactions[sectionId] || [];
    const hasReacted = sectionMyList.includes(emoji);

    // Optimistic UI updates
    setVisitor((prev) => {
      if (!prev) return null;
      const list = prev.mySectionReactions[sectionId] || [];
      return {
        ...prev,
        mySectionReactions: {
          ...prev.mySectionReactions,
          [sectionId]: hasReacted
            ? list.filter((e) => e !== emoji)
            : [...list, emoji],
        },
      };
    });

    setSummary((prev) => {
      const sectionReactMap = prev.sectionSummary[sectionId] || {};
      const currentCount = sectionReactMap[emoji] || 0;
      return {
        ...prev,
        sectionSummary: {
          ...prev.sectionSummary,
          [sectionId]: {
            ...sectionReactMap,
            [emoji]: hasReacted ? Math.max(0, currentCount - 1) : currentCount + 1,
          },
        },
      };
    });

    try {
      const res = await fetch(`/api/posts/${postId}/reactions/section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: vid, sectionId, emoji }),
      });
      if (!res.ok) throw new Error("Section reaction failed");
    } catch {
      toast.error("Failed to update reaction");
      // Rollback
      setVisitor((prev) => {
        if (!prev) return null;
        const list = prev.mySectionReactions[sectionId] || [];
        return {
          ...prev,
          mySectionReactions: {
            ...prev.mySectionReactions,
            [sectionId]: hasReacted
              ? [...list, emoji]
              : list.filter((e) => e !== emoji),
          },
        };
      });
      setSummary((prev) => {
        const sectionReactMap = prev.sectionSummary[sectionId] || {};
        const currentCount = sectionReactMap[emoji] || 0;
        return {
          ...prev,
          sectionSummary: {
            ...prev.sectionSummary,
            [sectionId]: {
              ...sectionReactMap,
              [emoji]: hasReacted ? currentCount + 1 : Math.max(0, currentCount - 1),
            },
          },
        };
      });
    }
  };

  const handleSectionTriggerClick = (sectionId: string, rect: DOMRect) => {
    setPopoverState({ sectionId, rect });
  };

  const trackExitIntentConvert = () => {
    queueEvent("exit_intent_converted", "subscribed_or_provided_feedback");
    flushEvents();
  };

  // Aggregate stats display helpers
  const totalHelpfulVotes = summary.helpful.yes + summary.helpful.no;
  const helpfulPercent =
    totalHelpfulVotes > 0
      ? Math.round((summary.helpful.yes / totalHelpfulVotes) * 100)
      : null;

  // 1. Emoji Reactions Widget
  const renderEmojiReactions = () => {
    if (!config.emojiReactionsOn) return null;
    return (
      <div className="space-y-4">
        <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          ENGAGE / POST REACTIONS
        </h4>
        <div className="flex gap-1.5 sm:gap-2.5 overflow-x-auto sm:overflow-x-visible pb-1 sm:pb-0 scrollbar-none">
          {["👍", "🔥", "🤯", "❤️", "😂"].map((emoji) => {
            const count = summary.emojiSummary[emoji] || 0;
            const isSelected = visitor?.myEmojis.includes(emoji);
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiReact(emoji)}
                className={`flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 border rounded-none text-[10px] sm:text-xs font-mono transition-all duration-200 cursor-pointer flex-shrink-0 ${
                  isSelected
                    ? "border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A] font-bold"
                    : "border-[#262626] bg-[#0c0c0c]/40 text-zinc-400 hover:border-zinc-550 hover:text-zinc-300"
                }`}
              >
                <span className="text-sm">{emoji}</span>
                <span>{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // 2. Helpful Vote Widget
  const renderHelpfulVote = () => {
    if (!config.helpfulVoteOn) return null;
    return (
      <div className="border border-[#262626] bg-[#0c0c0c]/20 p-5 flex flex-col justify-between space-y-4 rounded-none">
        <div className="space-y-1">
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            FEEDBACK / WAS THIS POST HELPFUL?
          </h4>
          {helpfulPercent !== null && (
            <p className="font-mono text-[10px] text-zinc-500">
              {helpfulPercent}% of readers voted Yes
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleHelpfulVote(true)}
            className={`flex-1 py-2.5 border text-xs font-bold font-mono uppercase tracking-widest transition-colors cursor-pointer rounded-none text-center ${
              visitor?.myHelpful === true
                ? "border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A]"
                : "border-[#262626] bg-[#0c0c0c]/40 text-zinc-400 hover:border-zinc-550 hover:text-zinc-200"
            }`}
          >
            YES
          </button>
          <button
            type="button"
            onClick={() => handleHelpfulVote(false)}
            className={`flex-1 py-2.5 border text-xs font-bold font-mono uppercase tracking-widest transition-colors cursor-pointer rounded-none text-center ${
              visitor?.myHelpful === false
                ? "border-red-500/20 bg-red-950/10 text-red-450"
                : "border-[#262626] bg-[#0c0c0c]/40 text-zinc-400 hover:border-zinc-550 hover:text-zinc-200"
            }`}
          >
            NO
          </button>
        </div>
      </div>
    );
  };

  // 3. Star Rating Widget
  const renderStarRating = () => {
    if (!config.starRatingOn) return null;
    return (
      <div className="border border-[#262626] bg-[#0c0c0c]/20 p-5 flex flex-col justify-between space-y-4 rounded-none">
        <div className="space-y-1">
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            REVIEW / STAR RATING
          </h4>
          <p className="font-mono text-[10px] text-zinc-500">
            {summary.rating.average} / 5 ({summary.rating.total} ratings)
          </p>
        </div>
        <div className="flex gap-1.5 items-center py-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const active = hoverRating ? star <= hoverRating : star <= (visitor?.myRating || 0);
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => handleStarRating(star)}
                className={`text-2xl transition-colors duration-150 cursor-pointer select-none ${
                  active ? "text-amber" : "text-zinc-650 hover:text-amber"
                }`}
              >
                ★
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // 4. End Post Survey Widget
  const renderEndSurvey = () => {
    if (!config.endSurveyOn) return null;
    return (
      <div className="border border-[#262626] bg-[#0c0c0c]/20 p-6 space-y-6 rounded-none">
        <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          FEEDBACK / POST-READ FEEDBACK
        </h4>

        {surveySubmitted ? (
          <p className="font-mono text-xs text-green py-2">
            ✓ Thank you! Your feedback has been recorded successfully.
          </p>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const target = e.currentTarget;
              const suggestions = (target.elements.namedItem("suggestions") as HTMLTextAreaElement)?.value;
              const difficulty = (target.elements.namedItem("difficulty") as HTMLInputElement)?.value;
              const vid = visitorId || getVisitorId();

              if (!vid) return;

              startTransition(async () => {
                try {
                  const res = await fetch(`/api/posts/${postId}/survey`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      visitorId: vid,
                      responseText: suggestions || null,
                      difficulty: difficulty || null,
                    }),
                  });
                  if (!res.ok) throw new Error("Submit failed");
                  setSurveySubmitted(true);
                } catch {
                  toast.error("Failed to submit feedback form");
                }
              });
            }}
            className="space-y-4"
          >
            {/* 3-way Difficulty Toggle */}
            {config.difficultyToggleOn && (
              <div className="space-y-2">
                <label className="block font-mono text-[10px] uppercase text-zinc-400">
                  HOW WAS THE DIFFICULTY OF THIS POST?
                </label>
                <input type="hidden" name="difficulty" id="survey-difficulty-input" />
                <div className="flex border border-[#262626] bg-black/40">
                  {[
                    { val: "too_basic", label: "TOO BASIC" },
                    { val: "just_right", label: "JUST RIGHT" },
                    { val: "too_advanced", label: "TOO ADVANCED" },
                  ].map((diff) => (
                    <button
                      key={diff.val}
                      type="button"
                      onClick={() => {
                        const input = document.getElementById("survey-difficulty-input") as HTMLInputElement;
                        if (input) input.value = diff.val;
                        const btns = document.querySelectorAll(".diff-select-btn");
                        btns.forEach((b) => b.classList.remove("bg-amber/10", "text-amber", "border-amber"));
                        const activeBtn = document.getElementById(`diff-btn-${diff.val}`);
                        activeBtn?.classList.add("bg-amber/10", "text-amber", "border-amber");
                      }}
                      id={`diff-btn-${diff.val}`}
                      className="diff-select-btn flex-1 py-2 font-mono text-[10px] text-zinc-400 hover:text-zinc-200 text-center transition-colors cursor-pointer border-r border-[#262626] last:border-none rounded-none"
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Free Text Prompt */}
            <div className="space-y-2">
              <label className="block font-mono text-[10px] uppercase text-zinc-400">
                WHAT SHOULD I COVER NEXT IN THE BLOG?
              </label>
              <textarea
                name="suggestions"
                rows={3}
                placeholder="Topics, frameworks, or specific projects you would like to see..."
                className="w-full rounded-none border border-[#262626] bg-[#0c0c0c] px-4 py-3 font-mono text-xs text-white placeholder-zinc-650 outline-none focus:border-amber transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-amber border border-amber font-mono text-[11px] font-bold uppercase tracking-widest text-black hover:bg-amber/90 transition-colors disabled:opacity-50 cursor-pointer rounded-none"
            >
              {isPending ? "SUBMITTING..." : "SUBMIT FEEDBACK"}
            </button>
          </form>
        )}
      </div>
    );
  };

  // 5. Notify Me subscription Widget
  const renderNotifyMe = () => {
    if (!config.notifyMeOn) return null;
    return (
      <div className="border border-[#262626] bg-[#0c0c0c]/20 p-6 space-y-4 rounded-none">
        <div className="space-y-1">
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            FOLLOW / SUBSCRIBE TO FUTURE POSTS
          </h4>
          <p className="font-mono text-[10px] text-zinc-500">
            Get email alerts when I publish content on this topic. No spam, ever.
          </p>
        </div>

        {notifySubmitted ? (
          <p className="font-mono text-xs text-green py-2">
            ✓ Subscribed! Thank you for following my writing updates.
          </p>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const target = e.currentTarget;
              const email = (target.elements.namedItem("email") as HTMLInputElement)?.value;
              const topic = (target.elements.namedItem("topic") as HTMLInputElement)?.value;

              if (!email) return;

              startTransition(async () => {
                try {
                  const res = await fetch(`/api/posts/${postId}/notify`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, topic }),
                  });
                  if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Subscription failed");
                  }
                  setNotifySubmitted(true);
                } catch (err: any) {
                  toast.error(err.message || "Failed to subscribe.");
                }
              });
            }}
            className="space-y-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="email"
                name="email"
                required
                placeholder="your.email@domain.com"
                className="w-full rounded-none border border-[#262626] bg-[#0c0c0c] px-4 py-2.5 font-mono text-xs text-white placeholder-zinc-650 outline-none focus:border-amber transition-colors"
              />
              <input
                type="text"
                name="topic"
                placeholder="Specific topic details (optional)"
                className="w-full rounded-none border border-[#262626] bg-[#0c0c0c] px-4 py-2.5 font-mono text-xs text-white placeholder-zinc-650 outline-none focus:border-amber transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-amber border border-amber font-mono text-[11px] font-bold uppercase tracking-widest text-black hover:bg-amber/90 transition-colors disabled:opacity-50 cursor-pointer rounded-none"
            >
              {isPending ? "SUBSCRIBING..." : "SUBSCRIBE"}
            </button>
          </form>
        )}
      </div>
    );
  };

  const widgetsMap: Record<string, React.ReactNode> = {
    "emoji-reactions": renderEmojiReactions(),
    "helpful-vote": renderHelpfulVote(),
    "star-rating": renderStarRating(),
    "end-survey": renderEndSurvey(),
    "notify-me": renderNotifyMe(),
  };

  return (
    <>
      {/* Article Content Wrapper */}
      <BlogContentClient
        html={html}
        postId={postId}
        containerRef={containerRef}
        sectionReactionsOn={config.sectionReactionsOn}
        sectionSummary={summary.sectionSummary}
        mySectionReactions={visitor?.mySectionReactions || {}}
        onSectionTriggerClick={handleSectionTriggerClick}
        onSectionReact={handleSectionReact}
        onCopyEvent={handleCopyEvent}
        widgets={widgetsMap}
      />

      {/* Floating Section Reactions Popover */}
      {popoverState && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setPopoverState(null)}
          />
          <div
            className="fixed z-50 flex items-center gap-1 bg-[#0c0c0c] border border-[#262626] p-1 font-mono text-xs shadow-lg rounded-none"
            style={{
              left: `${Math.max(110, Math.min(typeof window !== "undefined" ? window.innerWidth - 110 : 110, popoverState.rect.left + popoverState.rect.width / 2))}px`,
              top: `${popoverState.rect.top}px`,
              transform: "translate(-50%, -100%) translateY(-8px)",
            }}
          >
            {["👍", "🔥", "🤯", "❤️", "😂"].map((emoji) => {
              const mySectionList = visitor?.mySectionReactions[popoverState.sectionId] || [];
              const isMyReact = mySectionList.includes(emoji);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    handleSectionReact(popoverState.sectionId, emoji);
                    setPopoverState(null);
                  }}
                  className={`w-9 h-9 text-base hover:bg-white/5 transition-colors cursor-pointer rounded-none flex items-center justify-center ${
                    isMyReact
                      ? "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/30"
                      : "text-zinc-300"
                  }`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Reader-Intent Fallback Engagement Sections (Appended only if not placed inline) */}
      <div className="mt-16 border-t border-[#262626] pt-12 space-y-12 max-w-full lg:max-w-3xl text-left">
        {/* Emoji Reactions Bar */}
        {config.emojiReactionsOn && !hasPlaceholder("emoji-reactions") && renderEmojiReactions()}

        {/* Helpful Vote & Star Rating in Grid */}
        {((config.helpfulVoteOn && !hasPlaceholder("helpful-vote")) || 
          (config.starRatingOn && !hasPlaceholder("star-rating"))) && (
          <div className="grid gap-6 sm:grid-cols-2">
            {config.helpfulVoteOn && !hasPlaceholder("helpful-vote") && renderHelpfulVote()}
            {config.starRatingOn && !hasPlaceholder("star-rating") && renderStarRating()}
          </div>
        )}

        {/* Content Suggestion / Post End Survey */}
        {config.endSurveyOn && !hasPlaceholder("end-survey") && renderEndSurvey()}

        {/* Notify Me subscription */}
        {config.notifyMeOn && !hasPlaceholder("notify-me") && renderNotifyMe()}
      </div>

      {/* Exit Intent Popup (Desktop modal) */}
      {showExitIntent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowExitIntent(false)}
          />
          <div className="relative w-full max-w-md bg-[#0c0c0c] border border-[#262626] p-6 text-left shadow-2xl z-10 flex flex-col gap-4 rounded-none">
            <button
              type="button"
              onClick={() => setShowExitIntent(false)}
              className="absolute top-4 right-4 text-xs font-mono text-zinc-550 hover:text-zinc-300"
            >
              [CLOSE]
            </button>

            <div className="space-y-1">
              <h3 className="font-syne font-bold text-lg text-white">Before you go...</h3>
              <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                Would you like to stay in touch or suggest changes?
              </p>
            </div>

            {/* Exit intent tabs switcher */}
            <div className="flex border-b border-[#262626] mt-2">
              <button
                type="button"
                onClick={() => setExitTab("notify")}
                className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-wider border-b-2 text-center transition-colors cursor-pointer ${
                  exitTab === "notify"
                    ? "border-amber text-amber font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                SUBSCRIBE
              </button>
              <button
                type="button"
                onClick={() => setExitTab("survey")}
                className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-wider border-b-2 text-center transition-colors cursor-pointer ${
                  exitTab === "survey"
                    ? "border-amber text-amber font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                FEEDBACK
              </button>
            </div>

            <div className="py-1">
              {exitTab === "notify" ? (
                <div className="space-y-3">
                  <p className="font-mono text-[10px] text-zinc-400">
                    Leave your email to get notified when I cover new coding topics!
                  </p>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const target = e.currentTarget;
                      const email = (target.elements.namedItem("email") as HTMLInputElement)?.value;
                      if (!email) return;

                      startTransition(async () => {
                        try {
                          await fetch(`/api/posts/${postId}/notify`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email, topic: "Exit Intent Subscribe" }),
                          });
                          trackExitIntentConvert();
                          toast.success("Subscribed successfully!");
                          setTimeout(() => setShowExitIntent(false), 2000);
                        } catch {
                          toast.error("Failed to subscribe.");
                        }
                      });
                    }}
                    className="space-y-2.5"
                  >
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="your.email@domain.com"
                      className="w-full rounded-none border border-[#262626] bg-[#0c0c0c] px-4 py-2.5 font-mono text-xs text-white placeholder-zinc-655 outline-none focus:border-amber transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full py-2.5 bg-amber border border-amber font-mono text-[11px] font-bold uppercase tracking-widest text-black hover:bg-amber/90 transition-colors disabled:opacity-50 cursor-pointer rounded-none"
                    >
                      {isPending ? "SUBSCRIBING..." : "SUBSCRIBE"}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-mono text-[10px] text-zinc-400">
                    What suggestions do you have to improve this post?
                  </p>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const target = e.currentTarget;
                      const text = (target.elements.namedItem("suggestions") as HTMLTextAreaElement)?.value;
                      if (!text) return;
                      const vid = visitorId || getVisitorId();
                      if (!vid) return;

                      startTransition(async () => {
                        try {
                          await fetch(`/api/posts/${postId}/survey`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              visitorId: vid,
                              responseText: text,
                              difficulty: "just_right",
                            }),
                          });
                          trackExitIntentConvert();
                          toast.success("Feedback submitted!");
                          setTimeout(() => setShowExitIntent(false), 2000);
                        } catch {
                          toast.error("Failed to submit feedback.");
                        }
                      });
                    }}
                    className="space-y-2.5"
                  >
                    <textarea
                      name="suggestions"
                      required
                      rows={3}
                      placeholder="Your suggestions..."
                      className="w-full rounded-none border border-[#262626] bg-[#0c0c0c] px-4 py-2.5 font-mono text-xs text-white placeholder-zinc-655 outline-none focus:border-amber transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full py-2.5 bg-amber border border-amber font-mono text-[11px] font-bold uppercase tracking-widest text-black hover:bg-amber/90 transition-colors disabled:opacity-50 cursor-pointer rounded-none"
                    >
                      {isPending ? "SUBMITTING..." : "SUBMIT"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
