import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "neutral" | "gain" | "loss" | "warning" | "info" | "primary";

const variants: Record<Variant, string> = {
  neutral: "bg-surface-2 text-muted border-border",
  gain: "bg-gain/10 text-gain border-gain/25",
  loss: "bg-loss/10 text-loss border-loss/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  info: "bg-info/10 text-info border-info/25",
  primary: "bg-primary/10 text-primary border-primary/25",
};

export function Badge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
