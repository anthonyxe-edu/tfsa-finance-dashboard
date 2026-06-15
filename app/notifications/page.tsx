"use client";
import Link from "next/link";
import {
  BellOff,
  Check,
  Trash2,
  Receipt,
  Target,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { useNotifications } from "@/hooks/useDb";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AppNotification } from "@/lib/types";

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
  // Hide legacy/removed notification types so stale rows can't crash or clutter.
  const notes = useNotifications().filter(
    (n) => n.type === "spending" || n.type === "goal",
  );
  const unread = notes.filter((n) => !n.read).length;

  return (
    <div className="space-y-5">
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
                    <p className={`text-sm ${n.read ? "text-muted" : "text-fg"}`}>
                      {n.message}
                    </p>
                    <span className="text-xs text-faint">{timeAgo(n.ts)}</span>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => db.notifications.update(n.id, { read: true })}
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

      <Link
        href="/settings"
        className="flex items-center justify-center gap-2 rounded-card border border-border bg-surface/50 py-3 text-sm text-muted transition-colors hover:text-fg"
      >
        <SettingsIcon size={15} /> Alert thresholds, voice &amp; notifications live in Settings
      </Link>
    </div>
  );
}
