import type { Txn, CategoryRule, Goal } from "@/lib/types";
import { monthlyByCategory, baseline } from "@/lib/analysis";
import { currentMonth, fmtCurrency0 } from "@/lib/format";

export type PlanContext = {
  income: number; // monthly income
  avgSpend: number; // average monthly spend
  txns: Txn[];
  rules: CategoryRule[];
  goals: Goal[];
};

export type SuggestedGoal = { name: string; target: number; kind: Goal["kind"] };
export type Plan = { title: string; lines: string[]; goal?: SuggestedGoal };

type GoalType = {
  keys: string[];
  label: string;
  kind: Goal["kind"];
  typical: [number, number];
};

const TYPES: GoalType[] = [
  { keys: ["emergency", "rainy day", "safety net", "buffer"], label: "emergency fund", kind: "emergency", typical: [5000, 15000] },
  { keys: ["vacation", "trip", "travel", "holiday", "getaway", "flight"], label: "trip", kind: "vacation", typical: [2000, 6000] },
  { keys: ["car", "vehicle", "truck", "suv"], label: "car", kind: "standard", typical: [15000, 35000] },
  { keys: ["house", "down payment", "condo", "home", "mortgage"], label: "home down payment", kind: "standard", typical: [40000, 100000] },
  { keys: ["wedding", "engagement", "ring"], label: "wedding", kind: "standard", typical: [15000, 35000] },
  { keys: ["school", "tuition", "education", "course", "degree"], label: "education fund", kind: "standard", typical: [3000, 20000] },
  { keys: ["laptop", "computer", "phone", "camera", "tv", "furniture", "console"], label: "big purchase", kind: "standard", typical: [800, 4000] },
  { keys: ["debt", "loan", "credit card", "pay off", "payoff"], label: "debt payoff", kind: "standard", typical: [2000, 15000] },
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function parseAmount(text: string): number | null {
  const k = text.match(/\$?\s*([\d,]+(?:\.\d+)?)\s*k\b/i);
  if (k) return Math.round(parseFloat(k[1].replace(/,/g, "")) * 1000);
  const dollar = text.match(/\$\s*([\d,]+(?:\.\d+)?)/);
  if (dollar) return Math.round(parseFloat(dollar[1].replace(/,/g, "")));
  const bare = text.match(/\b(\d{3,}(?:,\d{3})*)\b/);
  if (bare) return Math.round(parseFloat(bare[1].replace(/,/g, "")));
  return null;
}

function parseMonths(text: string): number | null {
  const yr = text.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\b/i);
  if (yr) return Math.max(1, Math.round(parseFloat(yr[1]) * 12));
  const mo = text.match(/(\d+)\s*(?:months?|mos?)\b/i);
  if (mo) return Math.max(1, parseInt(mo[1]));
  const wk = text.match(/(\d+)\s*weeks?\b/i);
  if (wk) return Math.max(1, Math.round(parseInt(wk[1]) / 4.33));
  const byYear = text.match(/\bby\s+(?:\w+\s+)?(\d{4})\b/i);
  if (byYear) {
    const now = new Date();
    const months = (parseInt(byYear[1]) - now.getFullYear()) * 12 + (11 - now.getMonth());
    return months > 0 ? months : null;
  }
  if (/next summer/i.test(text)) return 9;
  if (/next year/i.test(text)) return 12;
  if (/this year/i.test(text)) return Math.max(1, 12 - new Date().getMonth());
  if (/next month/i.test(text)) return 1;
  return null;
}

function monthLabelAhead(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toLocaleDateString("en-CA", { month: "long", year: "numeric" });
}

function topCuts(ctx: PlanContext): { cat: string; over: number }[] {
  const hist = monthlyByCategory(ctx.txns, ctx.rules);
  const month = currentMonth();
  const prior = Object.fromEntries(
    Object.entries(hist).filter(([m]) => m < month),
  );
  const current = hist[month] ?? {};
  const cuts: { cat: string; over: number }[] = [];
  for (const [cat, spent] of Object.entries(current)) {
    const base = baseline(prior, cat);
    if (base > 0 && spent > base) cuts.push({ cat, over: spent - base });
  }
  return cuts.sort((a, b) => b.over - a.over).slice(0, 3);
}

/**
 * Turn a rough goal description into a realistic month-by-month savings plan,
 * using the user's real income/spending. Fully deterministic — no API.
 */
export function generatePlan(input: string, ctx: PlanContext): Plan {
  const text = input.trim();
  if (!text) {
    return {
      title: "Tell me a goal",
      lines: ['Try something like "save $20,000 for a car in 2 years".'],
    };
  }

  const type = TYPES.find((t) => t.keys.some((k) => text.toLowerCase().includes(k)));
  let amount = parseAmount(text);
  const months = parseMonths(text);
  const label = type?.label ?? "goal";
  const kind: Goal["kind"] = type?.kind ?? "standard";
  const disposable = Math.max(0, ctx.income - ctx.avgSpend);

  if (!amount) {
    if (type) {
      return {
        title: `Planning a ${label}`,
        lines: [
          `A ${label} usually runs between ${fmtCurrency0(type.typical[0])} and ${fmtCurrency0(type.typical[1])}.`,
          `Tell me your target and a timeframe — e.g. "${fmtCurrency0(type.typical[0])} in 18 months" — and I'll build the schedule.`,
        ],
      };
    }
    return {
      title: "Need a target amount",
      lines: [
        'Give me a number and a timeframe, like "$5,000 in 12 months", and I\'ll lay out the monthly plan.',
      ],
    };
  }

  const target = amount;
  const lines: string[] = [];

  if (months) {
    const perMonth = target / months;
    lines.push(
      `To hit ${fmtCurrency0(target)} for your ${label} in ${months} month${months === 1 ? "" : "s"} (by ${monthLabelAhead(months)}), set aside about ${fmtCurrency0(perMonth)}/month.`,
    );
    if (ctx.income > 0 && disposable >= 0) {
      if (perMonth <= disposable) {
        lines.push(
          `That fits comfortably — you average ~${fmtCurrency0(disposable)}/month left after spending, leaving ~${fmtCurrency0(disposable - perMonth)} of cushion.`,
        );
      } else {
        const gap = perMonth - disposable;
        lines.push(
          `Heads up — you currently have ~${fmtCurrency0(disposable)}/month free, so you'd need to find another ${fmtCurrency0(gap)}/month.`,
        );
        const cuts = topCuts(ctx);
        if (cuts.length) {
          lines.push(
            `Easiest wins this month: ${cuts.map((c) => `${c.cat} (${fmtCurrency0(c.over)} above your usual)`).join(", ")}.`,
          );
        }
        const n = Math.ceil(target / Math.max(1, disposable));
        lines.push(
          `Or, without stretching, the same ${fmtCurrency0(target)} is realistic in ~${n} months (around ${monthLabelAhead(n)}) at your current pace.`,
        );
      }
    } else {
      lines.push("Set your monthly income on the home screen and I'll show how much breathing room you have.");
    }
    const ms = [0.25, 0.5, 0.75, 1].map(
      (p) => `${Math.round(p * 100)}% (${fmtCurrency0(target * p)}) by ${monthLabelAhead(Math.ceil(months * p))}`,
    );
    lines.push(`Milestones: ${ms.join(" · ")}.`);
  } else if (disposable > 0) {
    const n = Math.ceil(target / disposable);
    lines.push(
      `At your current pace (~${fmtCurrency0(disposable)}/month free after spending), ${fmtCurrency0(target)} for your ${label} takes about ${n} month${n === 1 ? "" : "s"} — around ${monthLabelAhead(n)}.`,
    );
    lines.push('Want it sooner? Add a deadline like "in 18 months" and I\'ll work out the monthly amount.');
  } else {
    lines.push(
      `Tell me a timeframe (e.g. "in 2 years") and I'll work out the monthly amount for ${fmtCurrency0(target)}.`,
    );
  }

  const name = type ? cap(label) : text.length <= 40 ? cap(text) : "New goal";
  return { title: `Plan for your ${label}`, lines, goal: { name, target, kind } };
}
