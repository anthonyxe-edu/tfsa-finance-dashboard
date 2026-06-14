"use client";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { Login } from "@/components/auth/Login";
import { NotificationsEngine } from "@/components/providers/NotificationsEngine";

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
    </>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Gate>{children}</Gate>
    </AuthProvider>
  );
}
