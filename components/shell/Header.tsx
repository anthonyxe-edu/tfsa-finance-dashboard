"use client";
import { usePathname } from "next/navigation";
import { activeLabel } from "./nav";
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
    </header>
  );
}
