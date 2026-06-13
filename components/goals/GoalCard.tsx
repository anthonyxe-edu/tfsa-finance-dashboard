"use client";
import { useEffect, useState } from "react";
import {
  Trash2,
  ShieldCheck,
  Plane,
  Target as TargetIcon,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Form";
import { fmtCurrency0, fmtMonthLabel, currentMonth } from "@/lib/format";
import { monthsBetween } from "@/lib/analysis";
import type { Goal } from "@/lib/types";

type Tone = "primary" | "warning" | "info";
const kindMeta: Record<
  Goal["kind"],
  { label: string; icon: LucideIcon; tone: Tone }
> = {
  standard: { label: "Goal", icon: TargetIcon, tone: "primary" },
  emergency: { label: "Emergency", icon: ShieldCheck, tone: "warning" },
  vacation: { label: "Vacation", icon: Plane, tone: "info" },
};

export function GoalCard({ goal }: { goal: Goal }) {
  const [val, setVal] = useState(String(goal.saved));
  useEffect(() => setVal(String(goal.saved)), [goal.saved]);

  const pct = goal.target > 0 ? Math.min(100, (goal.saved / goal.target) * 100) : 0;
  const remaining = Math.max(0, goal.target - goal.saved);
  const meta = kindMeta[goal.kind];
  const Icon = meta.icon;
  const tone = pct >= 100 ? "gain" : meta.tone;

  let pace: string | null = null;
  if (goal.deadline && remaining > 0) {
    const m = monthsBetween(currentMonth(), goal.deadline);
    pace =
      m > 0
        ? `${fmtCurrency0(remaining / m)}/mo to ${fmtMonthLabel(goal.deadline)}`
        : `Due ${fmtMonthLabel(goal.deadline)}`;
  }

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-muted">
            <Icon size={16} />
          </span>
          <div>
            <div className="font-medium text-fg">{goal.name}</div>
            <Badge variant={meta.tone}>{meta.label}</Badge>
          </div>
        </div>
        <button
          onClick={() => db.goals.delete(goal.id)}
          aria-label={`Delete ${goal.name}`}
          className="cursor-pointer text-faint transition-colors hover:text-loss"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <span className="text-lg font-semibold text-fg tnum">
          {fmtCurrency0(goal.saved)}
        </span>
        <span className="text-sm text-muted tnum">
          of {fmtCurrency0(goal.target)}
        </span>
      </div>
      <ProgressBar
        value={goal.saved}
        max={goal.target || 1}
        tone={tone}
        className="mt-2"
      />
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={pct >= 100 ? "text-gain" : "text-muted"}>
          {pct.toFixed(0)}%{pct >= 100 ? " · funded" : ""}
        </span>
        {pace && <span className="text-faint">{pace}</span>}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Input
          type="number"
          min="0"
          className="h-8 w-28 text-xs"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => db.goals.update(goal.id, { saved: parseFloat(val) || 0 })}
          aria-label={`Update saved amount for ${goal.name}`}
        />
        <span className="text-xs text-faint">update saved</span>
      </div>
    </div>
  );
}
