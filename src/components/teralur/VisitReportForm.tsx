"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { HugeiconsIcon } from "@hugeicons/react";
import { BubbleChatIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
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

const PILIHAN_KONDISI = [
  { nilai: "active", label: "Ada aktivitas pekerjaan" },
  { nilai: "no_activity_seen", label: "Tidak terlihat aktivitas" },
  { nilai: "appears_complete", label: "Tampak selesai" },
] as const;

// Widget laporan warga bergaya obrolan bertahap: tombol bulat melayang di
// pojok kanan bawah (menghilang saat obrolan terbuka), lalu obrolan menanyakan
// kondisi lapangan lebih dulu; setelah dipilih, muncul pertanyaan lanjutan
// tentang catatan bersama tombol kirim. Hasil kirim/galat diberitahu lewat
// toast, bukan gelembung, agar isi obrolan tetap bersih. Di ponsel panelnya
// menjadi lembar bawah penuh (sheet), di desktop popover di atas tombol.
// Anti-massa tetap sama: bukti kerja (PoW) dipecahkan saat mengirim, plus
// honeypot `website` tersembunyi yang harus kosong (lihat src/lib/pow*.ts).

function useGenggam(): boolean {
  const [genggam, setGenggam] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const perbarui = () => setGenggam(mq.matches);
    perbarui();
    mq.addEventListener("change", perbarui);
    return () => mq.removeEventListener("change", perbarui);
  }, []);
  return genggam;
}

export function VisitReportForm({ dossierSlug }: { dossierSlug: string }) {
  const [terbuka, setTerbuka] = useState(false);
  const [langkah, setLangkah] = useState<"pilih" | "catatan">("pilih");
  const [dipilih, setDipilih] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [working, setWorking] = useState(false);
  const [tantangan, setTantangan] = useState<{ tantangan: string; kesulitan: number } | null>(null);
  const genggam = useGenggam();
  const tombolRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isiRef = useRef<HTMLDivElement>(null);
  const pernahTerbuka = useRef(false);

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

  // Fokus mengikuti panel: masuk ke obrolan saat dibuka, kembali ke tombol
  // setelah ditutup (tombol ikut menghilang saat terbuka; efek berjalan
  // setelah commit sehingga ref menunjuk tombol yang baru dipasang ulang).
  useEffect(() => {
    if (terbuka) {
      pernahTerbuka.current = true;
      panelRef.current?.focus();
    } else if (pernahTerbuka.current) {
      pernahTerbuka.current = false;
      tombolRef.current?.focus();
    }
  }, [terbuka]);

  // Escape menutup panel.
  useEffect(() => {
    if (!terbuka) return;
    function saatKunci(event: KeyboardEvent) {
      if (event.key === "Escape") setTerbuka(false);
    }
    window.addEventListener("keydown", saatKunci);
    return () => window.removeEventListener("keydown", saatKunci);
  }, [terbuka]);

  // Obrolan tumbuh ke bawah — jaga pertanyaan terbaru selalu terlihat.
  useEffect(() => {
    if (terbuka && isiRef.current) isiRef.current.scrollTop = isiRef.current.scrollHeight;
  }, [terbuka, langkah, working]);

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
          activityStatus: dipilih ?? "active",
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
      const { counts } = parsed.data;
      // react-hot-toast tanpa "description" — judul dan rincian dikirim sebagai JSX.
      toast.success(
        <span className="flex flex-col gap-0.5">
          <span className="font-semibold">Laporan terkirim — belum diverifikasi.</span>
          <span className="text-xs text-muted-foreground">
            Aktivitas {counts.active} · tanpa aktivitas terlihat {counts.no_activity_seen} ·
            tampak selesai {counts.appears_complete}
          </span>
        </span>,
      );
      setNote("");
      setDipilih(null);
      setLangkah("pilih"); // alur mulai lagi dari pertanyaan pertama
      setTantangan(null); // ambil tantangan segar untuk laporan berikutnya
      setTerbuka(false);
    } catch (error) {
      // Panel tetap terbuka agar isian bisa diperbaiki; alasan galat lewat toast.
      toast.error(error instanceof Error ? error.message : "Laporan belum dapat dikirim.");
    } finally {
      setWorking(false);
    }
  }

  const labelDipilih = PILIHAN_KONDISI.find((p) => p.nilai === dipilih)?.label;

  // Isi obrolan — dipakai bersama oleh lembar bawah (ponsel) dan popover (desktop).
  const isi = (
    <div
      ref={isiRef}
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4",
        !genggam && "max-h-[min(24rem,55svh)]",
      )}
    >
      <p className="max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm leading-snug">
        Sudah mampir ke lokasi proyek ini? Laporkan apa yang Anda lihat — tanpa perlu masuk.
      </p>

      {labelDipilih && (
        <div className="flex flex-col items-end gap-1">
          <p className="ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-hitam-aspal px-3.5 py-2.5 text-sm leading-snug text-kuning-papan">
            {labelDipilih}
          </p>
          {langkah === "catatan" && (
            <button
              type="button"
              onClick={() => setLangkah("pilih")}
              className="text-[11px] font-medium text-muted-foreground outline-none underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              Ubah pilihan
            </button>
          )}
        </div>
      )}

      {langkah === "pilih" ? (
        <>
          <p className="max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm leading-snug">
            Apa yang terlihat?
          </p>
          <div role="group" aria-label="Apa yang terlihat?" className="flex flex-wrap gap-1.5">
            {PILIHAN_KONDISI.map((pilihan) => {
              const aktif = dipilih === pilihan.nilai;
              return (
                <button
                  key={pilihan.nilai}
                  type="button"
                  aria-pressed={aktif}
                  onClick={() => {
                    setDipilih(pilihan.nilai);
                    setLangkah("catatan");
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                    aktif
                      ? "bg-hitam-aspal text-kuning-papan"
                      : "border border-input bg-background hover:border-foreground/30",
                  )}
                >
                  {pilihan.label}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p className="max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm leading-snug">
            Ada catatan tambahan? Isian ini opsional dan tidak ditampilkan publik.
          </p>
          <form onSubmit={submit} className="flex flex-col gap-2.5">
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
            <label className="sr-only" htmlFor="visit-note">
              Catatan opsional (tidak ditampilkan publik)
            </label>
            <textarea
              id="visit-note"
              value={note}
              maxLength={200}
              rows={2}
              autoFocus
              onChange={(event) => setNote(event.target.value)}
              placeholder="Tulis catatan (opsional)…"
              className="w-full resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
            <div className="flex items-center justify-between gap-3">
              <p aria-hidden className="text-[11px] tabular-nums text-muted-foreground">
                {note.length}/200
              </p>
              <button
                type="submit"
                disabled={working}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/85 active:translate-y-px disabled:pointer-events-none disabled:opacity-50"
              >
                {working ? "Mengirim…" : "Kirim laporan"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Latar backdrop (hanya ponsel): gelap + buram agar lembar terfokus;
          ketuk latar untuk menutup. Desktop tanpa backdrop mengikuti pola popover. */}
      {terbuka && genggam && (
        <button
          type="button"
          aria-label="Tutup laporan warga"
          onClick={() => setTerbuka(false)}
          className="fixed inset-0 z-[55] bg-hitam-aspal/40 outline-none backdrop-blur-sm animate-in fade-in duration-200 print:hidden"
        />
      )}

      {/* Lembar bawah penuh (ponsel): pegangan, kepala dengan tombol tutup di
          kiri dan judul di tengah — mengikuti pola sheet umum. */}
      {terbuka && genggam && (
        <div
          ref={panelRef}
          id="panel-laporan-warga"
          tabIndex={-1}
          role="dialog"
          aria-label="Laporan warga"
          className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[85svh] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border bg-card shadow-2xl shadow-hitam-aspal/20 outline-none animate-in fade-in slide-in-from-bottom-4 duration-200 print:hidden"
        >
          <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-foreground/15" />
          <div className="relative flex shrink-0 items-center justify-center gap-2 border-b border-border px-4 pb-3 pt-2">
            <button
              type="button"
              onClick={() => setTerbuka(false)}
              aria-label="Tutup laporan warga"
              className="absolute left-3 flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
            </button>
            <div className="text-center">
              <p className="font-heading text-sm font-semibold tracking-tight">Saya sudah lihat</p>
              <p className="text-xs text-muted-foreground">Laporan warga, belum diverifikasi.</p>
            </div>
          </div>
          {isi}
          {/* Ruang aman tepi bawah ponsel (notch/home-indicator). */}
          <div aria-hidden className="shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]" />
        </div>
      )}

      {/* Panel desktop: menempel rata pada tepi bawah viewport (tanpa celah),
          sudut membulat hanya di atas; melayang di atas posisi tombol. */}
      {terbuka && !genggam && (
        <div
          ref={panelRef}
          id="panel-laporan-warga"
          tabIndex={-1}
          role="dialog"
          aria-label="Laporan warga"
          className="fixed bottom-0 right-3 z-50 w-[min(22rem,calc(100vw-1.5rem))] animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-t-2xl border border-b-0 border-border bg-card shadow-2xl shadow-hitam-aspal/15 outline-none duration-150 md:right-6 print:hidden"
        >
          {/* Kepala panel: avatar tinta + judul + tombol tutup. */}
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-hitam-aspal text-kuning-papan"
            >
              <HugeiconsIcon icon={BubbleChatIcon} className="size-4" strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-semibold tracking-tight">Saya sudah lihat</p>
              <p className="text-xs text-muted-foreground">Laporan warga, belum diverifikasi.</p>
            </div>
            <button
              type="button"
              onClick={() => setTerbuka(false)}
              aria-label="Tutup laporan warga"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
            </button>
          </div>
          {isi}
        </div>
      )}

      {/* Tombol melayang — hanya saat obrolan tertutup. */}
      {!terbuka && (
        <button
          ref={tombolRef}
          type="button"
          onClick={() => setTerbuka(true)}
          aria-expanded={terbuka}
          aria-label="Saya sudah lihat — lapor kondisi proyek"
          className="fixed bottom-28 right-3 z-50 flex size-14 items-center justify-center rounded-full bg-hitam-aspal text-kuning-papan shadow-xl shadow-hitam-aspal/30 outline-none transition-transform active:scale-95 focus-visible:ring-3 focus-visible:ring-ring/30 print:hidden md:bottom-6 md:right-6"
        >
          <HugeiconsIcon icon={BubbleChatIcon} className="size-6" strokeWidth={2} />
        </button>
      )}
    </>
  );
}
