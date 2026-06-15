"use client";
import { useEffect, useState } from "react";
import { setKV, KV_KEYS } from "@/lib/db";
import { useKV } from "@/hooks/useDb";
import { useIncome } from "@/hooks/useIncome";
import { currentMonth } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Form";
import { PushToggle } from "@/components/notifications/PushToggle";
import { MonthlyIncomeTile } from "@/components/overview/MonthlyIncomeTile";
import { CashBalanceTile } from "@/components/overview/CashBalanceTile";
import { cn } from "@/lib/cn";
import { DEFAULT_SETTINGS, type Settings, type Tone } from "@/lib/types";

const TONES: { id: Tone; label: string; hint: string }[] = [
  { id: "hype", label: "Hype", hint: "Encouraging & upbeat" },
  { id: "roast", label: "Roast", hint: "Sassy, calls you out" },
  { id: "plain", label: "Plain", hint: "Just the facts" },
];

export default function SettingsPage() {
  const manualIncome = useKV<number>(KV_KEYS.monthlyIncome, 0);
  const month = currentMonth();
  const income = useIncome(month, manualIncome);
  const settings = useKV<Settings>(KV_KEYS.settings, DEFAULT_SETTINGS);

  const [warn, setWarn] = useState("");
  const [ratio, setRatio] = useState("");

  useEffect(() => {
    setWarn(String(settings.budgetWarnPct));
    setRatio(String(Math.round((settings.overspendRatio - 1) * 100)));
  }, [settings.budgetWarnPct, settings.overspendRatio]);

  async function save(next: Partial<Settings>) {
    await setKV(KV_KEYS.settings, { ...settings, ...next });
  }

  async function toggleBrowser(on: boolean) {
    if (on && typeof Notification !== "undefined") {
      const perm = await Notification.requestPermission();
      await save({ notifyBrowser: perm === "granted" });
    } else {
      await save({ notifyBrowser: false });
    }
  }

  return (
    <div className="space-y-6">
      {/* The figures that drive the orb + budget */}
      <section>
        <h2 className="font-title mb-3 text-base text-fg">Your numbers</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <MonthlyIncomeTile income={income} manual={manualIncome} />
          <CashBalanceTile />
        </div>
      </section>

      {/* iPhone push */}
      <PushToggle />

      {/* Alert thresholds + voice + desktop */}
      <Card title="Alerts" subtitle="What triggers a nudge, and how it sounds">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Budget warning (%)"
            htmlFor="s-warn"
            hint="Warn at this % of income spent"
          >
            <Input
              id="s-warn"
              type="number"
              step="5"
              value={warn}
              onChange={(e) => setWarn(e.target.value)}
              onBlur={() => save({ budgetWarnPct: parseFloat(warn) || 85 })}
            />
          </Field>
          <Field
            label="Overspend alert (%)"
            htmlFor="s-ratio"
            hint="A category over its usual by this much"
          >
            <Input
              id="s-ratio"
              type="number"
              step="5"
              value={ratio}
              onChange={(e) => setRatio(e.target.value)}
              onBlur={() =>
                save({ overspendRatio: 1 + (parseFloat(ratio) || 15) / 100 })
              }
            />
          </Field>
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-fg">Notification voice</p>
          <p className="mb-2 text-xs text-muted">
            How your nudges and the home one-liner talk to you.
          </p>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t.id}
                onClick={() => save({ tone: t.id })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-left transition-colors",
                  settings.tone === t.id
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted hover:text-fg",
                )}
              >
                <span className="block text-sm font-medium">{t.label}</span>
                <span className="block text-[11px] opacity-80">{t.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={settings.notifyBrowser}
            onChange={(e) => toggleBrowser(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          <span className="text-fg">
            Desktop browser notifications
            <span className="ml-2 text-xs text-faint">
              {settings.notifyBrowser ? "enabled" : "off"}
            </span>
          </span>
        </label>
      </Card>
    </div>
  );
}
