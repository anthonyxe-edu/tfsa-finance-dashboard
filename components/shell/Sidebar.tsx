"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { NAV } from "./nav";
import { cn } from "@/lib/cn";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface/40 p-3 md:flex">
      <Link href="/" className="mb-6 flex items-center gap-2.5 px-2 py-1">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-on-primary">
          <Wallet size={18} />
        </span>
        <span className="leading-tight">
          <span className="font-title block text-base tracking-wide">Finance</span>
          <span className="block text-[11px] text-muted">Spending &amp; Goals</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/15 font-medium text-fg"
                  : "text-muted hover:bg-surface-hover hover:text-fg",
              )}
            >
              <Icon
                size={18}
                className={cn(
                  "shrink-0",
                  active ? "text-primary" : "text-faint group-hover:text-fg",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pt-3 text-[11px] text-faint">Local · Sandbox</div>
    </aside>
  );
}
