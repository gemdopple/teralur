// TODO (owner: BE): implement the records import.
//
// Plan: read the raw procurement dumps from data/raw/ (git-ignored), map each row to a
// `records` table row (compute nama_norm / penyedia_norm with src/lib/match/normalisasi),
// and upsert on (sumber, id_sumber) using the service-role client from src/lib/db.ts.
// Schema: supabase/migrations/0001_init.sql.

async function main(): Promise<void> {
  console.log("import-records: belum diimplementasi (TODO, owner: BE).");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
