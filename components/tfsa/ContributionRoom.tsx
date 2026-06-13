"use client";
import { useEffect, useState } from "react";
import { setKV, KV_KEYS } from "@/lib/db";
import { useKV } from "@/hooks/useDb";
import { Field, Input } from "@/components/ui/Form";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { fmtCurrency0 } from "@/lib/format";
import type { ContributionRoom as CR } from "@/lib/types";

const DEFAULT: CR = { limit: 0, used: 0, year: new Date().getFullYear() };

export function ContributionRoom() {
  const stored = useKV<CR>(KV_KEYS.contributionRoom, DEFAULT);
  const [limit, setLimit] = useState("");
  const [used, setUsed] = useState("");

  useEffect(() => {
    setLimit(stored.limit ? String(stored.limit) : "");
    setUsed(stored.used ? String(stored.used) : "");
  }, [stored.limit, stored.used]);

  async function save(next: Partial<CR>) {
    await setKV(KV_KEYS.contributionRoom, { ...stored, ...next });
  }

  const remaining = Math.max(0, stored.limit - stored.used);
  const over = stored.used > stored.limit && stored.limit > 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Lifetime limit ($)" htmlFor="cr-limit">
          <Input
            id="cr-limit"
            type="number"
            min="0"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            onBlur={() => save({ limit: parseFloat(limit) || 0 })}
            placeholder="95000"
          />
        </Field>
        <Field label="Used so far ($)" htmlFor="cr-used">
          <Input
            id="cr-used"
            type="number"
            min="0"
            value={used}
            onChange={(e) => setUsed(e.target.value)}
            onBlur={() => save({ used: parseFloat(used) || 0 })}
            placeholder="40000"
          />
        </Field>
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-muted">Remaining room</span>
          <span className="font-semibold text-fg tnum">
            {fmtCurrency0(remaining)}
          </span>
        </div>
        <ProgressBar
          value={stored.used}
          max={stored.limit || 1}
          tone={over ? "loss" : "primary"}
        />
        <p className="mt-1.5 text-xs text-faint">
          {fmtCurrency0(stored.used)} of {fmtCurrency0(stored.limit)} used
          {over ? " · over your limit" : ""}
        </p>
      </div>
    </div>
  );
}
