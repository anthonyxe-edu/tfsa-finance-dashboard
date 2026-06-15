"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { activeLabel } from "./nav";
import { NotificationBell } from "./NotificationBell";
import { ZoomBack } from "./ZoomBack";
import { useAuth } from "@/components/auth/AuthProvider";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-canvas/85 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {!isHome && <ZoomBack />}
          <h1 className="font-title min-w-0 truncate text-xl">
            {activeLabel(pathname)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link
            href="/settings"
            aria-label="Settings"
            className={`grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface-2 transition-colors hover:bg-surface-hover hover:text-fg ${
              pathname.startsWith("/settings") ? "text-primary" : "text-muted"
            }`}
          >
            <Settings size={17} />
          </Link>
          <button
            onClick={() => signOut()}
            aria-label="Sign out"
            className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface-2 text-muted transition-colors hover:bg-surface-hover hover:text-fg"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
