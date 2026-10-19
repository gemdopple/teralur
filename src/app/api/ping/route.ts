import { connection, NextResponse } from "next/server";

// DELETE THIS ROUTE BEFORE PRODUCTION FREEZE (task T-27).
export const maxDuration = 30;

function envAda(nama: string): boolean {
  const nilai = process.env[nama];
  return typeof nilai === "string" && nilai.trim() !== "";
}

export async function GET() {
  // Request-time only: this smoke route must never be statically prerendered
  // (next.config.ts enables cacheComponents, so `dynamic = "force-dynamic"` is not
  // available here).
  await connection();
  const env = {
    SUPABASE_URL: envAda("SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: envAda("SUPABASE_SERVICE_ROLE_KEY"),
    MODEL_API_KEY: envAda("MODEL_API_KEY"),
    IP_HASH_SALT: envAda("IP_HASH_SALT"),
  };

  let db: { ok: boolean; recordsCount?: number; error?: string };
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { getSupabaseAdmin } = await import("@/lib/db");
      const { count, error } = await getSupabaseAdmin()
        .from("records")
        .select("*", { count: "exact", head: true });
      if (error) {
        db = { ok: false, error: error.message };
      } else {
        db = { ok: true, recordsCount: count ?? 0 };
      }
    } catch (error) {
      db = { ok: false, error: error instanceof Error ? error.message : "unknown error" };
    }
  } else {
    db = { ok: false, error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set" };
  }

  // TODO (task T-03): probe the vision provider here once the PM picks one.
  const model = { ok: "skipped" as const };

  return NextResponse.json({ env, db, model });
}
