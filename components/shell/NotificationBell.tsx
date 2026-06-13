"use client";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useDb";

export function NotificationBell() {
  const notes = useNotifications();
  const unread = notes.filter((n) => !n.read).length;
  return (
    <Link
      href="/notifications"
      aria-label={
        unread ? `Notifications, ${unread} unread` : "Notifications"
      }
      className="relative grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface-2 text-muted transition-colors hover:bg-surface-hover hover:text-fg"
    >
      <Bell size={18} />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-loss px-1 text-[10px] font-semibold text-white tnum">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
