"use client";
import { useEffect, useRef, useState } from "react";
import { Receipt, Target, Bell, Flame, type LucideIcon } from "lucide-react";
import { fmtCurrency0 } from "@/lib/format";
import { useZoomNavigate } from "@/hooks/useZoomNavigate";
import { useStreak } from "@/hooks/useStreak";
import { useKV } from "@/hooks/useDb";
import { KV_KEYS } from "@/lib/db";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/types";
import { safeToSpendToday } from "@/lib/engagement";
import { moneyMoment } from "@/lib/tone";
import { FrugalityOrb, burnStats } from "./FrugalityOrb";

type NavNode = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  blurb: string;
};

const NODES: NavNode[] = [
  { id: "spending", label: "Spending", href: "/spending", icon: Receipt, blurb: "Transactions, category breakdown & monthly trend." },
  { id: "goals", label: "Goals", href: "/goals", icon: Target, blurb: "Goal planner, savings targets, life context & advice." },
  { id: "alerts", label: "Alerts", href: "/notifications", icon: Bell, blurb: "Overspending, frugality nudges & goal milestones." },
];

const RADIUS_PCT = 39;

export function RadialOrbitalNav({
  income,
  spend,
  sourceLabel,
  caption,
}: {
  income: number;
  spend: number;
  sourceLabel?: string;
  caption?: string;
}) {
  const [rotation, setRotation] = useState(0);
  const [reduced, setReduced] = useState(false);
  const pausedRef = useRef(false);
  const zoomNavigate = useZoomNavigate();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      if (!pausedRef.current) setRotation((r) => (r + 0.18) % 360);
    }, 40);
    return () => clearInterval(id);
  }, [reduced]);

  const stats = burnStats(income, spend);
  const settings = useKV<Settings>(KV_KEYS.settings, DEFAULT_SETTINGS);
  const streak = useStreak();
  const safe = safeToSpendToday(income, spend);
  const moment = moneyMoment(settings.tone, {
    hasIncome: stats.hasIncome,
    safeToday: safe,
    burnPct: stats.pct,
    streak,
  });

  return (
    <section className="flex flex-col items-center">
      {caption && (
        <p className="mb-2 text-xs font-medium tracking-wider text-muted uppercase">
          {caption}
        </p>
      )}

      <div
        className="relative"
        style={{ width: "min(384px, 94vw)", aspectRatio: "1 / 1" }}
        onPointerEnter={() => (pausedRef.current = true)}
        onPointerLeave={() => (pausedRef.current = false)}
        onTouchStart={() => (pausedRef.current = true)}
      >
        {/* orbit path */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-border/60"
          style={{ width: `${RADIUS_PCT * 2}%`, height: `${RADIUS_PCT * 2}%` }}
        />

        {/* center orb — its size & color ARE the budget metric */}
        <div className="absolute inset-0 grid place-items-center">
          <FrugalityOrb income={income} spend={spend} maxWidth="min(248px, 64%)" />
        </div>

        {/* orbiting nav nodes */}
        {NODES.map((node, i) => {
          const angle =
            ((rotation + i * (360 / NODES.length) - 90) * Math.PI) / 180;
          const left = 50 + RADIUS_PCT * Math.cos(angle);
          const top = 50 + RADIUS_PCT * Math.sin(angle);
          const Icon = node.icon;
          return (
            <button
              key={node.id}
              onClick={() => zoomNavigate(node.href, "in")}
              className="absolute z-10 flex flex-col items-center gap-1 focus:outline-none"
              style={{ left: `${left}%`, top: `${top}%`, transform: "translate(-50%,-50%)" }}
              aria-label={`Open ${node.label}`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-full border border-border-strong bg-surface-2 text-muted transition-all duration-200 hover:border-primary hover:text-fg active:scale-95">
                <Icon size={18} />
              </span>
              <span className="text-[11px] font-medium text-muted">
                {node.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* budget readout — Safe-to-Spend is the daily hero number */}
      <div className="mt-5 flex flex-col items-center text-center">
        {stats.hasIncome ? (
          <>
            {/* kicker + streak on one tracked line */}
            <div className="flex items-center gap-2.5 text-[10px] font-medium tracking-[0.2em] text-muted uppercase">
              <span>Safe to spend today</span>
              {streak > 1 && (
                <>
                  <span className="h-3 w-px bg-border" />
                  <span className="inline-flex items-center gap-1 text-primary">
                    <Flame size={11} strokeWidth={2.5} />
                    <span className="tnum tracking-normal">{streak}d</span>
                  </span>
                </>
              )}
            </div>

            {/* hero amount: sized $, value, /day */}
            <div
              className="font-title mt-2 flex items-baseline justify-center"
              style={{ color: stats.hex }}
            >
              <span className="self-start text-2xl leading-none">$</span>
              <span className="tnum text-[3.75rem] leading-[0.9] tracking-tight">
                {Math.round(safe).toLocaleString()}
              </span>
              <span className="ml-1.5 self-end pb-2 text-sm font-normal text-faint">
                /day
              </span>
            </div>

            {/* editorial caption with a quiet left accent */}
            <p className="mt-4 max-w-[32ch] border-l-2 border-border pl-3 text-left text-[13px] leading-relaxed text-fg/80">
              {moment}
            </p>

            {/* hairline-divided micro-stats */}
            <div className="mt-4 inline-flex divide-x divide-border/60 rounded-lg border border-border/60 bg-surface/40">
              <div className="px-4 py-2">
                <div className="text-[10px] tracking-wider text-faint uppercase">
                  spent
                </div>
                <div className="tnum text-sm font-semibold" style={{ color: stats.hex }}>
                  {stats.pct}%
                </div>
              </div>
              <div className="px-4 py-2">
                <div className="text-[10px] tracking-wider text-faint uppercase">
                  of income
                </div>
                <div className="tnum text-sm font-semibold text-fg">
                  {fmtCurrency0(spend)}
                  <span className="text-faint"> / {fmtCurrency0(income)}</span>
                </div>
              </div>
            </div>

            {sourceLabel && (
              <span className="mt-2.5 text-[10px] tracking-wider text-faint uppercase">
                {sourceLabel}
              </span>
            )}
          </>
        ) : (
          <>
            <p className="font-title text-xl text-fg">Set your income</p>
            <p className="mt-2 max-w-[32ch] text-sm leading-relaxed text-muted">
              {moment}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
