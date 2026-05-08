"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:55321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "cole_aqui_a_anon_key_do_supabase_status",
  );
}
