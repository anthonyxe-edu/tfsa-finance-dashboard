"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type Tone = "primary" | "gain" | "warning" | "loss" | "info";

const tones: Record<Tone, string> = {
  primary: "bg-primary",
  gain: "bg-gain",
  warning: "bg-warning",
  loss: "bg-loss",
  info: "bg-info",
};

export function ProgressBar({
  value,
  max = 100,
  tone = "primary",
  className,
}: {
  value: number;
  max?: number;
  tone?: Tone;
  className?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

  // Animate from 0 up to the target on mount for a smooth fill-in.
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-surface-2",
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-[900ms] ease-out",
          tones[tone],
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
