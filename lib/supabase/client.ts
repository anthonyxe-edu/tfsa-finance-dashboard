import { createClient } from "@supabase/supabase-js";

// Public client values (safe to expose — they ship in the client bundle anyway;
// RLS is what protects data). Env vars override for rotation/other environments.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://sxtczkakmdmcakvlijng.supabase.co";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_-YkdKNPFx1ml26gapb2cpg_kUesiKT0";

/** Browser Supabase client. Session persists in localStorage; OTP login (no URL redirect). */
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

/** Current signed-in user id from the local session (no network round-trip). */
export async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error("Not signed in");
  return id;
}
