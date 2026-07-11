"use client";
import type { ReactNode } from "react";
import { preconnect } from "react-dom";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { Login } from "@/components/auth/Login";
import { NotificationsEngine } from "@/components/providers/NotificationsEngine";
import { RbcAutoSync } from "@/components/providers/RbcAutoSync";

function Gate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }
  if (!user) return <Login />;

  return (
    <>
      {children}
      <NotificationsEngine />
      <RbcAutoSync />
    </>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  // Open the TLS connection to Supabase before the first data fetch needs it.
  preconnect(
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
      "https://sxtczkakmdmcakvlijng.supabase.co",
  );
  return (
    <AuthProvider>
      <Gate>{children}</Gate>
    </AuthProvider>
  );
}
