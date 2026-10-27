"use client";

import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { selesaikanPoW } from "@/lib/pow-client";

const RESPONSE_SCHEMA = z.object({
  counts: z.object({
    active: z.number(),
    no_activity_seen: z.number(),
    appears_complete: z.number(),
  }),
});

const TANTANGAN_SCHEMA = z.object({
  tantangan: z.string().min(1),
  kesulitan: z.number().int().positive(),
});

// Form laporan warga — kartu lembut modern: kartu rounded-lg dengan bayangan
// tipis, masukan rounded-lg, tombol kirim pil tinta.
// Anti-massa tanpa login: bukti kerja (PoW) dipecahkan saat mengirim, plus
// honeypot `website` tersembunyi yang harus kosong (lihat src/lib/pow*.ts).

export function VisitReportForm({ dossierSlug }: { dossierSlug: string }) {
  const [activityStatus, setActivityStatus] = useState("active");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const [tantangan, setTantangan] = useState<{ tantangan: string; kesulitan: number } | null>(null);

  // Tantangan diambil sejak mount; kalau gagal, dicoba ulang saat submit.
  useEffect(() => {
    let batal = false;
    fetch("/api/visit-reports/challenge")
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const body: unknown = await res.json();
        const parsed = TANTANGAN_SCHEMA.safeParse(body);
        if (!parsed.success) throw new Error("bentuk");
        if (!batal) setTantangan(parsed.data);
      })
      .catch(() => {
        // diam: ulang saat submit
      });
    return () => {
      batal = true;
    };
  }, []);

  async function ambilTantangan() {
    const res = await fetch("/api/visit-reports/challenge");
    if (!res.ok) throw new Error("Laporan belum tersedia saat ini. Coba lagi nanti.");
    const body: unknown = await res.json();
    const parsed = TANTANGAN_SCHEMA.safeParse(body);
    if (!parsed.success) throw new Error("Laporan belum tersedia saat ini. Coba lagi nanti.");
    setTantangan(parsed.data);
    return parsed.data;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // currentTarget menjadi null setelah handler await — tangkap lebih awal.
    const elemenForm = event.currentTarget;
    const nilaiHoneypot =
      (elemenForm.elements.namedItem("website") as HTMLInputElement | null)?.value || undefined;
    setWorking(true);
    setMessage("");
    try {
      let deviceId = localStorage.getItem("teralur-device-id");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("teralur-device-id", deviceId);
      }
      const aktif = tantangan ?? (await ambilTantangan());
      // Pemecahan ~1–2 detik di peramban; bot yang membanjiri membayar biaya
      // ini per laporan, di atas batas laju perangkat + IP.
      const nonce = await selesaikanPoW(aktif.tantangan, aktif.kesulitan);
      const response = await fetch("/api/visit-reports", {
        method: "POST",
        headers: { "content-type": "application/json", "x-device-id": deviceId },
        body: JSON.stringify({
          dossierSlug,
          activityStatus,
          note: note.trim() || undefined,
          bukti: { tantangan: aktif.tantangan, nonce },
          website: nilaiHoneypot,
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const parsedError = z.object({ message: z.string().optional() }).safeParse(payload);
        throw new Error(
          parsedError.success ? parsedError.data.message ?? "Laporan belum dapat dikirim." : "Laporan belum dapat dikirim.",
        );
      }
      const parsed = RESPONSE_SCHEMA.safeParse(payload);
      if (!parsed.success) throw new Error("Respons laporan tidak valid.");
      setMessage(
        `Laporan warga, belum diverifikasi. Jumlah: aktivitas ${parsed.data.counts.active}, tanpa aktivitas terlihat ${parsed.data.counts.no_activity_seen}, tampak selesai ${parsed.data.counts.appears_complete}.`,
      );
      setNote("");
      setTantangan(null); // ambil tantangan segar untuk laporan berikutnya
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Laporan belum dapat dikirim.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="font-heading text-lg font-semibold tracking-tight">Saya sudah lihat</h2>
      <p className="mt-1 text-sm text-muted-foreground">Laporan warga, belum diverifikasi.</p>
      {/* Honeypot: tersembunyi dari manusia; bot pengisi otomatis dibuang diam-diam.
          Sengaja tak terkontrol React agar nilai isian bot tidak direset render. */}
      <input
        type="text"
        name="website"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
      />
      <label className="mt-4 block text-sm font-semibold" htmlFor="activity-status">
        Apa yang terlihat?
      </label>
      <select
        id="activity-status"
        value={activityStatus}
        onChange={(event) => setActivityStatus(event.target.value)}
        className="mt-1 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <option value="active">Ada aktivitas pekerjaan</option>
        <option value="no_activity_seen">Tidak terlihat aktivitas</option>
        <option value="appears_complete">Tampak selesai</option>
      </select>
      <label className="mt-4 block text-sm font-semibold" htmlFor="visit-note">
        Catatan opsional (tidak ditampilkan publik)
      </label>
      <textarea
        id="visit-note"
        value={note}
        maxLength={200}
        onChange={(event) => setNote(event.target.value)}
        className="mt-1 min-h-20 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      />
      <p className="mt-1 text-xs text-muted-foreground">{note.length}/200 karakter</p>
      <button
        type="submit"
        disabled={working}
        className="mt-4 inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-white transition-all hover:bg-primary/85 active:translate-y-px disabled:pointer-events-none disabled:opacity-50"
      >
        {working ? "Mengirim…" : "Kirim laporan"}
      </button>
      {message && <p role="status" className="mt-3 text-sm">{message}</p>}
    </form>
  );
}
