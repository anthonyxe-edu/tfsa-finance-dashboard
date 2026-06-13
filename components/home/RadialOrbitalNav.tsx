"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  PiggyBank,
  Target,
  HeartHandshake,
  Bell,
  ArrowRight,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { FrugalityOrb } from "./FrugalityOrb";

type NavNode = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  blurb: string;
};

const NODES: NavNode[] = [
  { id: "spending", label: "Spending", href: "/spending", icon: Receipt, blurb: "Transactions, category breakdown & monthly trend." },
  { id: "tfsa", label: "TFSA", href: "/tfsa", icon: PiggyBank, blurb: "Holdings, live ETF prices & contribution room." },
  { id: "goals", label: "Goals", href: "/goals", icon: Target, blurb: "Savings targets, progress & monthly pace." },
  { id: "life", label: "Life", href: "/life-context", icon: HeartHandshake, blurb: "Partner, family, vacations & emergency buffer." },
  { id: "alerts", label: "Alerts", href: "/notifications", icon: Bell, blurb: "ETF booms, overspend & goal milestones." },
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

        {/* center orb */}
        <div className="absolute inset-0 grid place-items-center">
          <FrugalityOrb
            income={income}
            spend={spend}
            sourceLabel={sourceLabel}
            maxWidth="min(216px, 57%)"
            compact
          />
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
          <Link
            href={active.href}
            className="mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong"
          >
            Open {active.label} <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </section>
  );
}
