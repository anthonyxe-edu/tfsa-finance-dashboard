"use client";
import { useEffect, useRef, useState } from "react";
import {
  Receipt,
  Target,
  Bell,
  ArrowRight,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
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
  const [activeId, setActiveId] = useState<string | null>(null);
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
    if (reduced || activeId) return;
    const id = setInterval(() => {
      if (!pausedRef.current) setRotation((r) => (r + 0.18) % 360);
    }, 40);
    return () => clearInterval(id);
  }, [reduced, activeId]);

  const active = NODES.find((n) => n.id === activeId) ?? null;
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
          const isActive = activeId === node.id;
          const dim = Boolean(activeId) && !isActive;
          return (
            <button
              key={node.id}
              onClick={() => setActiveId(isActive ? null : node.id)}
              className="absolute z-10 flex flex-col items-center gap-1 focus:outline-none"
              style={{ left: `${left}%`, top: `${top}%`, transform: "translate(-50%,-50%)" }}
              aria-label={`${node.label} — tap for details`}
              aria-expanded={isActive}
            >
              <span
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-full border transition-all duration-300",
                  isActive
                    ? "scale-110 border-primary bg-primary text-on-primary shadow-[0_0_18px_var(--color-primary)]"
                    : "border-border-strong bg-surface-2 text-muted",
                  dim && "opacity-40",
                )}
              >
                <Icon size={18} />
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium transition-colors",
                  isActive ? "text-fg" : "text-muted",
                  dim && "opacity-40",
                )}
              >
                {node.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* budget readout — Safe-to-Spend is the daily hero number */}
      <div className="mt-4 flex flex-col items-center text-center leading-none">
        {stats.hasIncome ? (
          <>
            {streak > 1 && (
              <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                🔥 {streak}-day streak
              </span>
            )}
            <p className="text-[11px] tracking-wider text-muted uppercase">
              safe to spend today
            </p>
            <p
              className="font-title tnum mt-1 text-5xl"
              style={{ color: stats.hex }}
            >
              {fmtCurrency0(safe)}
            </p>
            <p className="mt-3 max-w-[34ch] text-sm text-fg">{moment}</p>
            <p className="mt-2 text-xs tracking-wide text-muted tnum">
              {stats.pct}% spent · {fmtCurrency0(spend)} / {fmtCurrency0(income)}
            </p>
            {sourceLabel && (
              <p className="mt-1 text-[11px] tracking-wide text-faint uppercase">
                {sourceLabel}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-base font-semibold text-fg">Set your income</p>
            <p className="mt-1 max-w-[32ch] text-xs text-muted">{moment}</p>
          </>
        )}
      </div>

      {/* expanded detail panel */}
      {active && (
        <div
          className="mt-4 w-full max-w-sm rounded-card border border-border bg-surface p-4"
          style={{ animation: "panel-in 240ms ease" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
                <active.icon size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-fg">{active.label}</p>
                <p className="text-xs text-muted">{active.blurb}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveId(null)}
              aria-label="Close"
              className="text-faint transition-colors hover:text-fg"
            >
              <X size={16} />
            </button>
          </div>
          <button
            onClick={() => zoomNavigate(active.href, "in")}
            className="mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong"
          >
            Open {active.label} <ArrowRight size={15} />
          </button>
        </div>
      )}
    </section>
  );
}
