"use client";
import type { ReactNode } from "react";
import { PlaidProvider } from "@/components/providers/PlaidProvider";
import { NotificationsEngine } from "@/components/providers/NotificationsEngine";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PlaidProvider>
      {children}
      <NotificationsEngine />
    </PlaidProvider>
  );
}
