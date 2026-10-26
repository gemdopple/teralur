// T-39 (Lampiran I.1): buat/reset akun admin dev lewat service-role admin API.
// Jalankan: npx tsx --env-file=.env scripts/create-admin.ts
// Kata sandi acak ditulis ke .env sebagai DEV_ADMIN_PASSWORD (jangan pernah
// di-commit: .env saat ini TERLACAK git — jangan ikutkan .env saat commit).
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const email = "admin@teralur.test";

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const existing = await supabase.auth.admin.listUsers({ perPage: 200 });
  const found = existing.data?.users.find((u) => u.email?.toLowerCase() === email);

  const password = randomBytes(18).toString("base64url");
  if (found) {
    // Reset + konfirmasi agar akun lama apa pun kondisinya bisa dipakai login.
    const { error } = await supabase.auth.admin.updateUserById(found.id, {
      password,
      email_confirm: true,
      ban_duration: "none",
    });
    if (error) throw new Error(`updateUserById failed: ${error.message}`);
    console.log(`Admin account reset: ${email} (id ${found.id})`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw new Error(`createUser failed: ${error.message}`);
    console.log(`Admin account created: ${email} (id ${data.user?.id})`);
  }

  // Simpan kata sandi di .env lokal sebagai DEV_ADMIN_PASSWORD (buat ganti atau tambah).
  const envPath = ".env";
  const envText = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const line = `DEV_ADMIN_PASSWORD=${password}`;
  const updated = envText.match(/^DEV_ADMIN_PASSWORD=.*$/m)
    ? envText.replace(/^DEV_ADMIN_PASSWORD=.*$/m, line)
    : `${envText}${envText.endsWith("\n") || envText === "" ? "" : "\n"}${line}\n`;
  writeFileSync(`${envPath}.tmp`, updated);
  renameSync(`${envPath}.tmp`, envPath);
  console.log("DEV_ADMIN_PASSWORD written to .env");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
