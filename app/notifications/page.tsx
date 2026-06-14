"use client";
import { useEffect, useState } from "react";
import {
  BellOff,
  Check,
  Trash2,
  TrendingUp,
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
import { DEFAULT_SETTINGS, type Settings, type AppNotification } from "@/lib/types";

const typeIcon: Record<AppNotification["type"], LucideIcon> = {
  etf: TrendingUp,
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
  const notes = useNotifications();
  const settings = useKV<Settings>(KV_KEYS.settings, DEFAULT_SETTINGS);

  const [boom, setBoom] = useState("");
  const [low, setLow] = useState("");
  const [ratio, setRatio] = useState("");

  useEffect(() => {
    setBoom(String(settings.etfBoomPct));
    setLow(String(settings.etfLowPct));
    setRatio(String(Math.round((settings.overspendRatio - 1) * 100)));
  }, [settings.etfBoomPct, settings.etfLowPct, settings.overspendRatio]);

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
      <Card title="Alert settings" subtitle="Thresholds that trigger notifications">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="ETF booming at (%)" htmlFor="s-boom" hint="Day gain ≥ this">
            <Input
              id="s-boom"
              type="number"
              step="0.5"
              value={boom}
              onChange={(e) => setBoom(e.target.value)}
              onBlur={() => save({ etfBoomPct: parseFloat(boom) || 2 })}
            />
          </Field>
          <Field label="ETF low at (%)" htmlFor="s-low" hint="Day drop ≤ this">
            <Input
              id="s-low"
              type="number"
              step="0.5"
              value={low}
              onChange={(e) => setLow(e.target.value)}
              onBlur={() => save({ etfLowPct: parseFloat(low) || -2 })}
            />
          </Field>
          <Field
            label="Overspend alert (%)"
            htmlFor="s-ratio"
            hint="Over baseline by this much"
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
        <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm">
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
            description="Alerts about your ETFs, overspending in saving months, and goal milestones will show up here."
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {notes.map((n) => {
              const Icon = typeIcon[n.type];
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
