"use client";
import { Coins } from "lucide-react";
import { useMemo } from "react";
import { fmtCurrency0 } from "@/lib/format";

type Tone = { stroke: string; glow: string; text: string };

const TONES: Record<"good" | "watch" | "over", Tone> = {
  good: { stroke: "var(--color-gain)", glow: "var(--color-gain)", text: "text-gain" },
  watch: { stroke: "var(--color-warning)", glow: "var(--color-warning)", text: "text-warning" },
  over: { stroke: "var(--color-loss)", glow: "var(--color-loss)", text: "text-loss" },
};

const SIZE = 300;
const R = 120;
const C = 2 * Math.PI * R;

/**
 * Budget-burn orb: the ring fills with how much of this month's income has been
 * spent. Lower burn = more "frugal" = more floating coins + a greener orb.
 */
export function FrugalityOrb({
  income,
  spend,
  sourceLabel,
}: {
  income: number;
  spend: number;
  sourceLabel?: string;
}) {
  const hasIncome = income > 0;
  const burn = hasIncome ? spend / income : 0;
  const fill = Math.min(burn, 1); // ring never visually exceeds full
  const frugality = Math.max(0, Math.min(1, 1 - burn)); // 1 = saved it all

  const tone = !hasIncome
    ? TONES.watch
    : burn >= 1
      ? TONES.over
      : burn >= 0.85
        ? TONES.watch
        : TONES.good;

  // Coin count scales with frugality (0–7). Positions are deterministic so they
  // don't reshuffle on every render.
  const coinCount = hasIncome ? Math.round(frugality * 8) : 0;
  const coins = useMemo(
    () =>
      Array.from({ length: coinCount }, (_, i) => {
        // Rise along the left/right flanks so the center readout stays clear.
        const onLeft = i % 2 === 0;
        const flank = onLeft ? 12 : 72;
        return {
          left: flank + ((i * 7) % 16),
          delay: (i * 0.5) % 3,
          duration: 2.8 + (i % 3) * 0.5,
          size: i % 3 === 0 ? 18 : 14,
        };
      }),
    [coinCount],
  );

  const dashoffset = C * (1 - fill);

  return (
    <div
      className="relative"
      style={{ width: "min(300px, 78vw)", aspectRatio: "1 / 1" }}
      role="img"
      aria-label={
        hasIncome
          ? `${Math.round(burn * 100)} percent of income spent this month`
          : "Monthly income not set"
      }
    >
      {/* Spinning gradient glow */}
      <div
        className="absolute inset-3 rounded-full blur-2xl"
        style={{
          background: `conic-gradient(from 0deg, ${tone.glow}, transparent 35%, ${tone.glow} 70%, transparent)`,
          opacity: 0.28 + frugality * 0.22,
          animation: "orb-spin 9s linear infinite",
        }}
      />

      {/* Progress ring + inner orb */}
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="relative h-full w-full"
        style={{ animation: "orb-breathe 6s ease-in-out infinite" }}
      >
        <defs>
          <radialGradient id="orbFill" cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor="var(--color-surface-2)" />
            <stop offset="100%" stopColor="var(--color-canvas)" />
          </radialGradient>
        </defs>
        {/* inner sphere */}
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R - 14} fill="url(#orbFill)" />
        {/* track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={14}
        />
        {/* progress arc */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={tone.stroke}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={dashoffset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{
            transition: "stroke-dashoffset 700ms ease, stroke 400ms ease",
            filter: `drop-shadow(0 0 8px ${tone.glow})`,
          }}
        />
      </svg>

      {/* Floating coins (money animation) — in front of the sphere, on the flanks */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {coins.map((c, i) => (
          <Coins
            key={i}
            size={c.size}
            className="absolute text-[#fbbf24]"
            style={{
              left: `${c.left}%`,
              bottom: "26%",
              filter: "drop-shadow(0 0 6px rgba(251,191,36,0.55))",
              animation: `coin-float ${c.duration}s ease-in-out ${c.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Center readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {hasIncome ? (
          <>
            <span className={`text-5xl font-bold tnum ${tone.text}`}>
              {Math.round(burn * 100)}
              <span className="text-2xl align-top">%</span>
            </span>
            <span className="mt-1 text-xs tracking-wider text-muted uppercase">
              of income spent
            </span>
            <span className="mt-2 text-sm text-fg tnum">
              {fmtCurrency0(spend)}{" "}
              <span className="text-faint">/ {fmtCurrency0(income)}</span>
            </span>
            {sourceLabel && (
              <span className="mt-0.5 text-[10px] tracking-wide text-faint uppercase">
                {sourceLabel}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="text-lg font-semibold text-fg">Set your income</span>
            <span className="mt-1 max-w-[10rem] text-xs text-muted">
              Add a monthly income below to power the orb.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
