import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service role key. RLS is enabled with no
// policies (migration 0001_init.sql), so this server client is the ONLY path to the
// database. Never import this module from client code.

let klien: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (klien !== null) return klien;
  const url = process.env.SUPABASE_URL;
  const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !kunci) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (server env)");
  }
  klien = createClient(url, kunci, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return klien;
}
