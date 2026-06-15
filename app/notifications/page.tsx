"use client";
import { useEffect, useState } from "react";
import {
  BellOff,
  Check,
  Trash2,
  Receipt,
  Target,
  type LucideIcon,
} from "lucide-react";
import { db, setKV, KV_KEYS } from "@/lib/db";
import { useNotifications, useKV } from "@/hooks/useDb";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input } from "@/components/ui/Form";
import { PushToggle } from "@/components/notifications/PushToggle";
import { cn } from "@/lib/cn";
import {
  DEFAULT_SETTINGS,
  type Settings,
  type Tone,
  type AppNotification,
} from "@/lib/types";

const TONES: { id: Tone; label: string; hint: string }[] = [
  { id: "hype", label: "Hype", hint: "Encouraging & upbeat" },
  { id: "roast", label: "Roast", hint: "Sassy, calls you out" },
  { id: "plain", label: "Plain", hint: "Just the facts" },
];

const typeIcon: Record<AppNotification["type"], LucideIcon> = {
  spending: Receipt,
  goal: Target,
};

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationsPage() {
  // Hide legacy/removed notification types (e.g. old "etf") so stale rows neither
  // crash the page nor clutter the list.
  const notes = useNotifications().filter(
    (n) => n.type === "spending" || n.type === "goal",
  );
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

  const unread = notes.filter((n) => !n.read).length;

  return (
    <div className="space-y-5">
      <PushToggle />

      <Card title="Alert settings" subtitle="Thresholds that trigger notifications">
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

      <Card
        title="Notifications"
        subtitle={unread ? `${unread} unread` : "All caught up"}
        action={
          notes.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => db.notifications.markAllRead()}
              >
                <Check size={15} /> Mark all read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => db.notifications.clear()}
              >
                <Trash2 size={15} /> Clear
              </Button>
            </div>
          )
        }
      >
        {notes.length === 0 ? (
          <EmptyState
            icon={<BellOff size={20} />}
            title="No notifications yet"
            description="Alerts about overspending, frugality, and goal progress will show up here."
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {notes.map((n) => {
              // Fallback guards against legacy/unknown types (e.g. removed "etf")
              // so a stale row can never render `undefined` and crash the page.
              const Icon = typeIcon[n.type] ?? BellOff;
              return (
                <li
                  key={n.id}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      n.read ? "bg-surface-2 text-faint" : "bg-primary/15 text-primary"
                    }`}
                  >
                    <Icon size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm ${n.read ? "text-muted" : "text-fg"}`}
                    >
                      {n.message}
                    </p>
                    <span className="text-xs text-faint">{timeAgo(n.ts)}</span>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() =>
                        db.notifications.update(n.id, { read: true })
                      }
                      aria-label="Mark read"
                      className="cursor-pointer text-faint transition-colors hover:text-fg"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
