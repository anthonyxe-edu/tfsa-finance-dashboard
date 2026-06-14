"use client";
import { useState } from "react";
import { Wallet, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export function Login() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) setError(error.message);
    // On success, onAuthStateChange swaps this screen for the app.
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-on-primary shadow-[0_0_28px_var(--color-primary)]">
            <Wallet size={26} />
          </span>
          <h1 className="font-title mt-4 text-2xl text-fg">Finance</h1>
          <p className="mt-1 text-sm text-muted">
            {step === "email"
              ? "Sign in with your email to sync across your devices."
              : `Enter the 6-digit code we sent to ${email}.`}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={sendCode} className="space-y-3">
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-12 w-full rounded-lg border border-border bg-surface-2 px-4 text-base text-fg placeholder:text-faint focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !email.trim()}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-base font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:opacity-50"
            >
              {busy ? <Loader2 className="animate-spin" size={18} /> : <>Send code <ArrowRight size={18} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-3">
            <input
              type="text"
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="h-12 w-full rounded-lg border border-border bg-surface-2 px-4 text-center text-2xl tracking-[0.4em] text-fg placeholder:text-faint placeholder:tracking-normal focus:border-primary focus:outline-none tnum"
            />
            <button
              type="submit"
              disabled={busy || code.length < 6}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-base font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:opacity-50"
            >
              {busy ? <Loader2 className="animate-spin" size={18} /> : "Verify & sign in"}
            </button>
            <div className="flex justify-between text-xs text-muted">
              <button type="button" onClick={() => { setStep("email"); setCode(""); setError(null); }} className="hover:text-fg">
                ← Change email
              </button>
              <button type="button" onClick={sendCode} disabled={busy} className="hover:text-fg">
                Resend code
              </button>
            </div>
          </form>
        )}

        {error && <p className="mt-3 text-center text-sm text-loss">{error}</p>}
      </div>
    </div>
  );
}
