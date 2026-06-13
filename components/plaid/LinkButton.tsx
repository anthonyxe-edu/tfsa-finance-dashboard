"use client";
import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePlaid } from "@/components/providers/PlaidProvider";

export function LinkButton() {
  const { sync, setLinked } = usePlaid();
  const [token, setToken] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plaid/create-link-token", { method: "POST" })
      .then((r) => r.json())
      .then((d) =>
        d.link_token ? setToken(d.link_token) : setErr(d.error ?? "Plaid init failed"),
      )
      .catch(() => setErr("Plaid init failed"));
  }, []);

  const onSuccess = useCallback(
    async (public_token: string) => {
      await fetch("/api/plaid/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token }),
      });
      setLinked(true);
      await sync();
    },
    [sync, setLinked],
  );

  const { open, ready } = usePlaidLink({ token: token ?? "", onSuccess });

  if (err) {
    return (
      <span className="text-xs text-loss" title={err}>
        Plaid not configured
      </span>
    );
  }
  return (
    <Button onClick={() => open()} disabled={!ready || !token} size="sm">
      <Link2 size={16} /> Link account
    </Button>
  );
}
