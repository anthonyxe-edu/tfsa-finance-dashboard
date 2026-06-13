"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DisplayCardProps = {
  icon?: ReactNode;
  title?: string;
  description?: string;
  date?: string;
  urgent?: boolean;
  className?: string;
};

export function DisplayCard({
  icon,
  title = "Notification",
  description = "",
  date = "",
  urgent = false,
  className,
}: DisplayCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-36 w-[20rem] -skew-y-[6deg] select-none flex-col justify-between rounded-xl border bg-surface px-4 py-3 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.7)] transition-all duration-500",
        "hover:border-border-strong",
        urgent ? "border-loss/40" : "border-border",
        className,
      )}
    >
      <div>
        <span
          className={cn(
            "relative inline-flex items-center justify-center rounded-full p-1.5",
            urgent ? "bg-loss/15 text-loss" : "bg-primary/15 text-primary",
          )}
        >
          {icon}
          {urgent && (
            <span
              className="absolute inset-0 rounded-full border border-loss"
              style={{ animation: "urgent-ping 1.6s ease-out infinite" }}
            />
          )}
        </span>
        <p
          className={cn(
            "mt-2 text-sm font-semibold",
            urgent ? "text-loss" : "text-fg",
          )}
        >
          {title}
        </p>
      </div>
      <p className="line-clamp-2 text-xs text-muted">{description}</p>
      <p className="text-[11px] text-faint">{date}</p>
    </div>
  );
}

/**
 * A fanned stack of cards. On hover the stack spreads apart (desktop
 * enhancement); on touch the cards stay stacked and the whole section links out.
 */
export function DisplayCards({ cards }: { cards: DisplayCardProps[] }) {
  // The first (most important / urgent) card sits on top via z-index and is
  // fully legible at rest; the rest peek out behind it and fan apart on hover.
  const positions = [
    "[grid-area:stack] z-30 translate-x-3 translate-y-2 hover:translate-y-0",
    "[grid-area:stack] z-20 -translate-x-4 translate-y-7 hover:translate-y-12",
    "[grid-area:stack] z-10 -translate-x-11 translate-y-12 hover:translate-y-20",
  ];
  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-90 transition-opacity hover:opacity-100">
      {cards.slice(0, 3).map((card, i) => (
        <DisplayCard
          key={i}
          {...card}
          className={cn(positions[i], card.className)}
        />
      ))}
    </div>
  );
}

export default DisplayCards;
