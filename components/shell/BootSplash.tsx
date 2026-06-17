"use client";
import { useEffect, useState } from "react";

/**
 * Load-in animation: on a fresh app boot the orb ignites, the title fades in,
 * then the whole screen zooms into the orb and clears to reveal the live app.
 * Shows once per session (sessionStorage); skipped under reduced-motion.
 */
export function BootSplash() {
  const [phase, setPhase] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    if (sessionStorage.getItem("booted")) {
      setPhase("done");
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      sessionStorage.setItem("booted", "1");
      setPhase("done");
      return;
    }
    const t1 = setTimeout(() => setPhase("out"), 1150);
    const t2 = setTimeout(() => {
      sessionStorage.setItem("booted", "1");
      setPhase("done");
    }, 1780);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={`boot-splash${phase === "out" ? " boot-out" : ""}`}
      aria-hidden="true"
    >
      <div className="boot-orb" />
      <div className="boot-title font-title">Finance</div>
    </div>
  );
}
