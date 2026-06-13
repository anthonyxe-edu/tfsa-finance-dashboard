import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const hasHeader = Boolean(title || action);
  return (
    <section
      className={cn(
        "rounded-card border border-border bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.25)]",
        className,
      )}
    >
      {hasHeader && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-semibold text-fg">{title}</h2>
            )}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn(hasHeader ? "px-5 pb-5" : "p-5", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
