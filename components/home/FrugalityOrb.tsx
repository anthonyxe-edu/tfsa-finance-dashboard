"use client";
import { fmtCurrency0 } from "@/lib/format";
import { ParticleGlobe } from "./ParticleGlobe";

// Tone hexes mirror the design tokens; passed to the canvas globe + used for the ring.
const TONES = {
  good: "#9dff3c", // neon lime (brand) — frugal / under budget
  watch: "#f59e0b", // amber — near the line
  over: "#f43f5e", // red — over budget
} as const;

const SIZE = 300;
const R = 120;
const C = 2 * Math.PI * R;

/**
 * Budget-burn orb. A rotating neon point-cloud globe sits behind a thin ring
 * that fills with how much of this month's income has been spent. Frugality
 * (1 − burn) brightens the globe + outer glow; tone shifts lime → amber → red.
 * Size-agnostic via container-query (cqi) units (`maxWidth` + `compact` props).
 */
export function FrugalityOrb({
  income,
  spend,
  sourceLabel,
  maxWidth = "min(300px, 78vw)",
  compact = false,
}: {
  income: number;
  spend: number;
  sourceLabel?: string;
  maxWidth?: string;
  compact?: boolean;
}) {
  const hasIncome = income > 0;
  const burn = hasIncome ? spend / income : 0;
  const fill = Math.min(burn, 1);
  const frugality = Math.max(0, Math.min(1, 1 - burn));

  const toneKey = !hasIncome
    ? "good"
    : burn >= 1
      ? "over"
      : burn >= 0.85
        ? "watch"
        : "good";
  const hex = TONES[toneKey];

  const dashoffset = C * (1 - fill);

  return (
    <div
      className="relative"
      style={{
        width: maxWidth,
        aspectRatio: "1 / 1",
        containerType: "inline-size",
      }}
      role="img"
      aria-label={
        hasIncome
          ? `${Math.round(burn * 100)} percent of income spent this month`
          : "Monthly income not set"
      }
    >
      {/* Outer neon glow — brighter the more frugal */}
      <div
        className="absolute inset-[12%] rounded-full blur-2xl"
        style={{
          background: `radial-gradient(circle, ${hex} 0%, transparent 70%)`,
          opacity: 0.12 + frugality * 0.33,
          animation: "orb-breathe 6s ease-in-out infinite",
        }}
      />

      {/* Rotating particle globe */}
      <ParticleGlobe color={hex} intensity={frugality} sphereScale={0.62} />

      {/* Soft dark vignette so the center readout stays legible over the dots */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div
          className="h-[58%] w-[58%] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(11,17,32,0.92) 36%, rgba(11,17,32,0.6) 60%, transparent 78%)",
          }}
        />
      </div>

      {/* Budget-burn ring */}
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="relative h-full w-full">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={8}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={hex}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={dashoffset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{
            transition: "stroke-dashoffset 700ms ease, stroke 400ms ease",
            filter: `drop-shadow(0 0 6px ${hex})`,
          }}
        />
      </svg>

      {/* Center readout (cqi-scaled) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
        {hasIncome ? (
          <>
            <span className="font-bold tnum text-[18cqi]" style={{ color: hex }}>
              {Math.round(burn * 100)}
              <span className="align-top text-[8cqi]">%</span>
            </span>
            <span className="mt-[2cqi] text-[4cqi] tracking-wider text-muted uppercase">
              of income spent
            </span>
            {!compact && (
              <span className="mt-[3cqi] text-[4.8cqi] text-fg tnum">
                {fmtCurrency0(spend)}{" "}
                <span className="text-faint">/ {fmtCurrency0(income)}</span>
              </span>
            )}
            {!compact && sourceLabel && (
              <span className="mt-[1cqi] text-[3.2cqi] tracking-wide text-faint uppercase">
                {sourceLabel}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="text-[6.5cqi] font-semibold text-fg">
              Set your income
            </span>
            {!compact && (
              <span className="mt-[2cqi] max-w-[60cqi] text-[4cqi] text-muted">
                Add a monthly income below to power the orb.
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
