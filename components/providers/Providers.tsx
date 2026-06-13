"use client";
import type { ReactNode } from "react";
import { NotificationsEngine } from "@/components/providers/NotificationsEngine";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <NotificationsEngine />
    </>
  );
}
