"use client";
import { useEffect, useState } from "react";
import { BellRing, Loader2, Check, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  pushSupported,
  isStandalone,
  isPushEnabled,
  enablePush,
  disablePush,
  sendTestPush,
} from "@/lib/push";

export function PushToggle() {
  const [supported, setSupported] = useState(true);
  const [standalone, setStandalone] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setSupported(pushSupported());
    setStandalone(isStandalone());
    isPushEnabled().then(setEnabled);
  }, []);

  async function onEnable() {
    setBusy(true);
    setMsg(null);
    const r = await enablePush();
    setBusy(false);
    if (r.ok) {
      setEnabled(true);
      setMsg("Enabled — you'll be nudged about overspending even when the app is closed.");
    } else {
      setMsg(r.error ?? "Could not enable notifications.");
    }
  }

  async function onDisable() {
    setBusy(true);
    setMsg(null);
    await disablePush();
    setEnabled(false);
    setBusy(false);
    setMsg("Push notifications turned off for this device.");
  }

  async function onTest() {
    setBusy(true);
    setMsg(null);
    const r = await sendTestPush();
    setBusy(false);
    setMsg(r.ok ? "Test sent — it should appear as a notification." : r.error ?? "Test failed.");
  }

  return (
    <Card
      title="iPhone notifications"
      subtitle="Get nudged about overspending — even when the app is closed"
    >
      {!supported ? (
        <p className="text-sm text-muted">
          This browser doesn&apos;t support push. On iPhone, open this app from your
          Home Screen to enable notifications.
        </p>
      ) : (
        <div className="space-y-3">
          {!standalone && (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-surface-2 p-3 text-sm text-muted">
              <Smartphone size={16} className="mt-0.5 shrink-0 text-primary" />
              <span>
                On iPhone: tap the Share icon → <b>Add to Home Screen</b>, then open the
                app from there before enabling.
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!enabled ? (
              <Button onClick={onEnable} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" size={16} /> : <BellRing size={16} />}
                Enable notifications
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={onTest} disabled={busy}>
                  {busy ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  Send test
                </Button>
                <Button variant="ghost" onClick={onDisable} disabled={busy}>
                  Turn off
                </Button>
              </>
            )}
          </div>

          {msg && <p className="text-sm text-fg">{msg}</p>}
        </div>
      )}
    </Card>
  );
}
