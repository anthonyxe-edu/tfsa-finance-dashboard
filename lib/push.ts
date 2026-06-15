import { supabase } from "@/lib/supabase/client";

// Public VAPID key — safe to ship in the client. The matching private key
// lives only in the Supabase `app_secrets` table (service-role only).
const VAPID_PUBLIC =
  "BO3W57ysvp-MWPbIrVAsfNpY4CtSt_4gZ6I-lAeSciWZgaNK9AU_tz4xp1R6tb70zSltZud2-BY6NeMdlzLXSak";

const FUNCTIONS_URL =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "https://sxtczkakmdmcakvlijng.supabase.co") + "/functions/v1";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Whether the app runs as an installed PWA — required for push on iOS. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Is there already an active push subscription for this device? */
export async function isPushEnabled(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return Boolean(sub);
}

export async function enablePush(): Promise<{ ok: boolean; error?: string }> {
  if (!pushSupported())
    return { ok: false, error: "This browser doesn't support push notifications." };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: "Sign in first." };

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const perm = await Notification.requestPermission();
  if (perm !== "granted")
    return { ok: false, error: "Notifications were not allowed." };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });
  }
  const json = sub.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userData.user.id,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    },
    { onConflict: "endpoint" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  }
}

/** Round-trips a real push through the server to prove the pipeline works. */
export async function sendTestPush(): Promise<{ ok: boolean; error?: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: "Sign in first." };
  try {
    const res = await fetch(`${FUNCTIONS_URL}/push-self`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        title: "Finance",
        body: "Push notifications are working.",
      }),
    });
    if (!res.ok) return { ok: false, error: `Server returned ${res.status}.` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
