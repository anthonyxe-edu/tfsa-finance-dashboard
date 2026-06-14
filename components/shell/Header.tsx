"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, activeLabel } from "./nav";
import { cn } from "@/lib/cn";
import { NotificationBell } from "./NotificationBell";
import { ZoomBack } from "./ZoomBack";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-canvas/85 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {!isHome && <ZoomBack />}
          <h1 className="font-title min-w-0 truncate text-xl">
            {activeLabel(pathname)}
          </h1>
        </div>
        <NotificationBell />
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
