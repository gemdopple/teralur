"use client";

import { useEffect, useState } from "react";
import { formatTanggal } from "@/lib/dates";

// Moderasi laporan warga (T-47 UI, Lampiran L.6 / E.13): tabel hanya-baca
// tanggal, keadaan (dalam Bahasa Indonesia), dan catatan apa adanya — hanya
// untuk tim. Data dari GET /api/admin/visit-reports?projectId={records.id};
// sesi admin dikirim otomatis lewat cookie httpOnly same-origin. Bersifat
// hanya-baca; tanpa tombol hapus di v1.1.

type Laporan = {
  id: string;
  activityStatus: "active" | "no_activity_seen" | "appears_complete";
  note: string | null;
  date: string;
};

const KEADAAN: Record<Laporan["activityStatus"], string> = {
  active: "Ada aktivitas pekerjaan",
  no_activity_seen: "Tidak terlihat aktivitas",
  appears_complete: "Tampak selesai",
};

export function TabelLaporanWarga({ projectId }: { projectId: string }) {
  const [laporan, setLaporan] = useState<Laporan[] | null>(null);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    let batal = false;
    fetch(`/api/admin/visit-reports?projectId=${encodeURIComponent(projectId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { reports?: Laporan[] };
        if (!batal) setLaporan(Array.isArray(body.reports) ? body.reports : []);
      })
      .catch(() => {
        if (!batal) setGagal(true);
      });
    return () => {
      batal = true;
    };
  }, [projectId]);

  return (
    <section aria-label="Laporan warga">
      <h2 className="font-heading text-lg font-bold">Laporan warga</h2>
      <p className="mt-1 text-sm text-neutral-700">
        Hanya untuk tim; tidak tampil publik. Hanya baca.
      </p>

      {laporan === null && !gagal ? (
        <p className="mt-3 text-sm text-neutral-700">Memuat laporan…</p>
      ) : null}

      {gagal ? (
        <p className="mt-3 rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-700">
          Daftar laporan belum dapat dimuat. Coba muat ulang halaman.
        </p>
      ) : null}

      {laporan !== null && laporan.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-700">
          Belum ada laporan warga untuk proyek ini.
        </p>
      ) : null}

      {laporan !== null && laporan.length > 0 ? (
        <div className="mt-3 overflow-x-auto rounded-lg border border-neutral-300 bg-white">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-600">
                <th scope="col" className="px-3 py-2 font-semibold">
                  Tanggal
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Keadaan
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Catatan
                </th>
              </tr>
            </thead>
            <tbody>
              {laporan.map((item) => (
                <tr key={item.id} className="border-b border-neutral-100 last:border-b-0">
                  <td className="px-3 py-2 align-top whitespace-nowrap">
                    {formatTanggal(item.date.slice(0, 10))}
                  </td>
                  <td className="px-3 py-2 align-top">{KEADAAN[item.activityStatus] ?? item.activityStatus}</td>
                  <td className="px-3 py-2 align-top break-words">{item.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
