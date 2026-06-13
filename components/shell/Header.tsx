"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { NAV, activeLabel } from "./nav";
import { cn } from "@/lib/cn";
import { usePlaid } from "@/components/providers/PlaidProvider";
import { Button } from "@/components/ui/Button";
import { NotificationBell } from "./NotificationBell";
import { LinkButton } from "@/components/plaid/LinkButton";

export function Header() {
  const pathname = usePathname();
  const { linked, loading, lastSync, sync } = usePlaid();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-canvas/85 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-5 sm:px-8">
        <h1 className="min-w-0 truncate text-lg font-semibold">
          {activeLabel(pathname)}
        </h1>

        <div className="flex items-center gap-2.5">
          {linked === false && <LinkButton />}
          {linked && (
            <span className="hidden items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-muted sm:inline-flex">
              <CheckCircle2 size={14} className="text-gain" /> Linked
              {lastSync && (
                <span className="text-faint">
                  ·{" "}
                  {new Date(lastSync).toLocaleTimeString("en-CA", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => sync()}
            disabled={loading || !linked}
            aria-label="Sync"
          >
            <RefreshCw size={16} className={cn(loading && "animate-spin")} />
            <span className="hidden sm:inline">Sync</span>
          </Button>
          <NotificationBell />
        </div>
      </div>

      {/* Mobile navigation */}
      <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs",
                active ? "bg-primary/15 text-fg" : "text-muted",
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
