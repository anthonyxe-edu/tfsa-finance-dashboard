"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Zap, TrendingUp, Wallet, Target, BellOff } from "lucide-react";
import { useNotifications } from "@/hooks/useDb";
import { DisplayCard } from "@/components/ui/display-cards";
import { SwipeableCardDeck } from "@/components/ui/swipeable-card-deck";
import type { AppNotification } from "@/lib/types";

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function iconFor(n: AppNotification) {
  const size = 15;
  if (n.type === "etf")
    return n.severity === "urgent" ? <Zap size={size} /> : <TrendingUp size={size} />;
  if (n.type === "spending") return <Wallet size={size} />;
  return <Target size={size} />;
}

function titleFor(n: AppNotification): string {
  if (n.type === "etf") return n.severity === "urgent" ? "Market alert" : "ETF update";
  if (n.type === "spending") return "Spending watch";
  return "Goal progress";
}

export function NotificationCards() {
  const router = useRouter();
  const notes = useNotifications();

  // Urgent first, then most recent.
  const sorted = [...notes].sort((a, b) => {
    const au = a.severity === "urgent" ? 1 : 0;
    const bu = b.severity === "urgent" ? 1 : 0;
    if (au !== bu) return bu - au;
    return b.ts - a.ts;
  });

  const cards = sorted.slice(0, 6).map((n) => ({
    id: n.id,
    node: (
      <DisplayCard
        icon={iconFor(n)}
        title={titleFor(n)}
        description={n.message}
        date={relTime(n.ts)}
        urgent={n.severity === "urgent"}
      />
    ),
  }));

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="font-title text-base tracking-wide text-fg">
            Notifications
          </h2>
          <p className="text-xs text-muted">
            {notes.length
              ? `Swipe to see more${notes.length > 6 ? ` · ${notes.length} total` : ""}`
              : "Outstanding alerts"}
          </p>
        </div>
        <Link
          href="/notifications"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View all <ArrowRight size={13} />
        </Link>
      </div>

      {cards.length ? (
        <SwipeableCardDeck items={cards} onTap={() => router.push("/notifications")} />
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border bg-surface/50 py-10 text-center">
          <BellOff size={22} className="text-faint" />
          <p className="text-sm text-muted">No alerts right now.</p>
          <p className="text-xs text-faint">
            ETF booms, overspend, and goal milestones will appear here.
          </p>
        </div>
      )}
    </section>
  );
}
