import { cn } from "@/lib/cn";
import { fmtCurrency } from "@/lib/format";

export function Money({
  value,
  currency = "CAD",
  className,
  colorBySign = false,
  showSign = false,
}: {
  value: number;
  currency?: string;
  className?: string;
  colorBySign?: boolean;
  showSign?: boolean;
}) {
  const colorCls = colorBySign
    ? value > 0
      ? "text-gain"
      : value < 0
        ? "text-loss"
        : "text-muted"
    : "";
  const sign = showSign && value > 0 ? "+" : "";
  return (
    <span className={cn("tnum", colorCls, className)}>
      {sign}
      {fmtCurrency(value, currency)}
    </span>
  );
}
