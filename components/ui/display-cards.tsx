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

/** A single flat notification card. Positioning/stacking is handled by the deck. */
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
        "flex h-full w-full flex-col justify-between rounded-xl border bg-surface px-4 py-3 shadow-[0_12px_32px_-14px_rgba(0,0,0,0.75)]",
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
