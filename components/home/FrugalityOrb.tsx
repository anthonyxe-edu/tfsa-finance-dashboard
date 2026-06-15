"use client";
import { ParticleGlobe } from "./ParticleGlobe";

// Tone hexes mirror the design tokens. Lime = frugal, amber = watch, red = over.
const TONES = {
  good: "#9dff3c", // neon lime (brand)
  watch: "#f59e0b", // amber
  over: "#f43f5e", // red
} as const;

export type BurnStats = {
  hasIncome: boolean;
  burn: number; // spend / income (can exceed 1)
  frugality: number; // clamp(1 - burn, 0, 1)
  hex: string; // continuous lime → amber → red
  pct: number; // round(burn * 100)
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Blend lime → amber → red as t goes 0 → 1 (keeps lime crisp, avoids muddy mid). */
function toneHex(t: number): string {
  const x = Math.max(0, Math.min(1, t));
  const lime = hexToRgb(TONES.good);
  const amber = hexToRgb(TONES.watch);
  const red = hexToRgb(TONES.over);
  const [from, to, k] =
    x < 0.5 ? [lime, amber, x / 0.5] : [amber, red, (x - 0.5) / 0.5];
  return rgbToHex(lerp(from[0], to[0], k), lerp(from[1], to[1], k), lerp(from[2], to[2], k));
}

/** Derive the orb's spending signal once, shared by the orb and the readout below it. */
export function burnStats(income: number, spend: number): BurnStats {
  const hasIncome = income > 0;
  const burn = hasIncome ? spend / income : 0;
  const frugality = Math.max(0, Math.min(1, 1 - burn));
  // Stay lime until ~60% spent, then warm toward fully red by ~115%.
  const warm = hasIncome ? (burn - 0.6) / 0.55 : 0;
  return { hasIncome, burn, frugality, hex: hasIncome ? toneHex(warm) : TONES.good, pct: Math.round(burn * 100) };
}

/**
 * The orb IS the budget metric — no ring, no number inside. As this month's
 * spending climbs it **shrinks** (big & bright when frugal → small dense ember
 * when overspent) and **warms** from neon lime through amber to red. The %
 * readout lives below it in the parent. Over budget adds an urgent pulse.
 */
export function FrugalityOrb({
  income,
  spend,
  maxWidth = "min(248px, 64%)",
}: {
  income: number;
  spend: number;
  maxWidth?: string;
}) {
  const { hasIncome, burn, frugality, hex } = burnStats(income, spend);
  // Big when frugal, contracts toward a small core the more you've spent.
  const orbScale = hasIncome ? 0.55 + 0.45 * frugality : 1;
  const over = hasIncome && burn >= 1;
  const intensity = hasIncome ? 0.2 + 0.65 * frugality : 0.7;

  return (
    <div
      className="relative"
      style={{
        width: maxWidth,
        aspectRatio: "1 / 1",
        containerType: "inline-size",
        transform: `scale(${orbScale})`,
        transition: "transform 900ms cubic-bezier(0.22,1,0.36,1)",
      }}
      role="img"
      aria-label={
        hasIncome
          ? `${Math.round(burn * 100)} percent of income spent this month`
          : "Monthly income not set"
      }
    >
      {/* Outer neon glow — brighter when frugal, fast urgent pulse when over budget. */}
      <div
        className="absolute inset-[10%] rounded-full blur-2xl"
        style={{
          background: `radial-gradient(circle, ${hex} 0%, transparent 70%)`,
          opacity: 0.16 + frugality * 0.34,
          animation: `orb-breathe ${over ? 2.2 : 6}s ease-in-out infinite`,
        }}
      />

      {/* The energy mass itself. */}
      <ParticleGlobe color={hex} intensity={intensity} sphereScale={0.66} />
    </div>
  );
}
