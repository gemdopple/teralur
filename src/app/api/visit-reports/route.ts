import { NextResponse } from "next/server";
import { visitReportRequestSchema } from "@/lib/api-contract";
import { getSupabaseAdmin } from "@/lib/db";
import {
  consumeRateLimit,
  databaseConfigured,
  deviceRateKey,
  readJsonBody,
} from "@/lib/server-api";

const ACTIVITY_TO_INTERNAL = {
  active: "aktivitas",
  no_activity_seen: "tidak_terlihat",
  appears_complete: "selesai",
} as const;

const ACTIVITY_KEYS = ["active", "no_activity_seen", "appears_complete"] as const;

export async function POST(request: Request) {
  const deviceId = request.headers.get("x-device-id");
  if (!deviceId || !/^[0-9a-f-]{36}$/i.test(deviceId)) {
    return NextResponse.json(
      { error: "DEVICE_ID_REQUIRED", message: "Perangkat belum siap mengirim laporan." },
      { status: 400 },
    );
  }
  const body = await readJsonBody(request);
  if (!body.valid) {
    return NextResponse.json({ error: "INVALID_JSON", message: "Isi permintaan tidak valid." }, { status: 400 });
  }
  const parsed = visitReportRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_REPORT", message: "Periksa pilihan laporan dan catatan (maks. 200 karakter)." },
      { status: 400 },
    );
  }

  if (!databaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_NOT_CONFIGURED", message: "Laporan kunjungan belum tersedia." },
      { status: 503 },
    );
  }
  if (!process.env.IP_HASH_SALT) {
    return NextResponse.json(
      { error: "RATE_LIMIT_NOT_CONFIGURED", message: "Laporan belum tersedia karena pembatasan belum dikonfigurasi." },
      { status: 503 },
    );
  }

  const { dossierSlug, activityStatus, note } = parsed.data;
  const { data: submission, error: lookupError } = await getSupabaseAdmin()
    .from("submissions")
    .select("id,record_id")
    .eq("slug", dossierSlug)
    .maybeSingle();
  if (lookupError) {
    console.error("Unable to look up visit report dossier:", lookupError.message);
    return NextResponse.json(
      { error: "DOSSIER_LOOKUP_FAILED", message: "Proyek belum dapat ditemukan." },
      { status: 502 },
    );
  }
  if (!submission) {
    return NextResponse.json({ error: "NOT_FOUND", message: "Proyek tidak ditemukan." }, { status: 404 });
  }

  const deviceHash = deviceRateKey(deviceId);
  const allowed = await consumeRateLimit(`visit:${deviceHash}`, 5);
  if (!allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Batas laporan per jam tercapai. Coba lagi nanti." },
      { status: 429 },
    );
  }

  const projectKey = submission.record_id ?? submission.id;
  // Invarian privasi F-14: catatan hanya tersimpan untuk tim dan TIDAK PERNAH
  // dikembalikan ke klien maupun dirender publik — respons hanya memuat counts.
  const { error: insertError } = await getSupabaseAdmin().from("kunjungan").insert({
    kunci_proyek: projectKey,
    keadaan: ACTIVITY_TO_INTERNAL[activityStatus],
    catatan: note?.trim() || null,
    perangkat_hash: deviceHash,
  });
  if (insertError?.code === "23505") {
    return NextResponse.json(
      { error: "ALREADY_REPORTED", message: "Sudah melapor hari ini untuk proyek ini." },
      { status: 409 },
    );
  }
  if (insertError) {
    console.error("Unable to save visit report:", insertError.message);
    return NextResponse.json(
      { error: "REPORT_SAVE_FAILED", message: "Laporan belum dapat disimpan. Coba lagi nanti." },
      { status: 502 },
    );
  }

  const { data: reports, error: countError } = await getSupabaseAdmin().rpc("visit_report_counts", {
    p_project_key: projectKey,
  });
  if (countError) {
    console.error("Unable to count visit reports:", countError.message);
    return NextResponse.json(
      { error: "REPORT_COUNT_FAILED", message: "Laporan tersimpan, tetapi jumlah belum dapat dimuat." },
      { status: 502 },
    );
  }

  const counts = Object.fromEntries(ACTIVITY_KEYS.map((key) => [key, 0])) as Record<
    (typeof ACTIVITY_KEYS)[number],
    number
  >;
  const reverseActivity = Object.fromEntries(
    Object.entries(ACTIVITY_TO_INTERNAL).map(([api, internal]) => [internal, api]),
  ) as Record<string, (typeof ACTIVITY_KEYS)[number]>;
  for (const report of reports ?? []) {
    const key = reverseActivity[report.keadaan];
    if (key) counts[key] = Number(report.jumlah);
  }

  return NextResponse.json({ counts }, { status: 201 });
}
