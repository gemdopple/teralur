"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";

const RESPONSE_SCHEMA = z.object({
  counts: z.object({
    active: z.number(),
    no_activity_seen: z.number(),
    appears_complete: z.number(),
  }),
});

export function VisitReportForm({ dossierSlug }: { dossierSlug: string }) {
  const [activityStatus, setActivityStatus] = useState("active");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setMessage("");
    try {
      let deviceId = localStorage.getItem("teralur-device-id");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("teralur-device-id", deviceId);
      }
      const response = await fetch("/api/visit-reports", {
        method: "POST",
        headers: { "content-type": "application/json", "x-device-id": deviceId },
        body: JSON.stringify({
          dossierSlug,
          activityStatus,
          note: note.trim() || undefined,
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Laporan belum dapat dikirim.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-neutral-300 bg-white p-5">
      <h2 className="font-heading text-xl font-bold">Saya sudah lihat</h2>
      <p className="mt-1 text-sm text-neutral-700">Laporan warga, belum diverifikasi.</p>
      <label className="mt-4 block text-sm font-semibold" htmlFor="activity-status">
        Apa yang terlihat?
      </label>
      <select
        id="activity-status"
        value={activityStatus}
        onChange={(event) => setActivityStatus(event.target.value)}
        className="mt-1 w-full rounded-md border border-neutral-400 px-3 py-2"
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
        className="mt-1 min-h-20 w-full rounded-md border border-neutral-400 px-3 py-2"
      />
      <p className="mt-1 text-xs text-neutral-600">{note.length}/200 karakter</p>
      <button
        type="submit"
        disabled={working}
        className="mt-4 rounded-md border-2 border-black bg-[#FFC400] px-4 py-2 font-semibold disabled:opacity-50"
      >
        {working ? "Mengirim…" : "Kirim laporan"}
      </button>
      {message && <p role="status" className="mt-3 text-sm">{message}</p>}
    </form>
  );
}
