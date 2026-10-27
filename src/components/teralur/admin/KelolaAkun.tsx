"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Pengelolaan akun (admin): tabel akun yang sudah ada + buat/edit/hapus.
//
// Satu komponen dipakai untuk dua jenis akun yang bentuknya berbeda:
// - kontraktor: entitas `contractors` (+ akun login), punya nama perusahaan,
//   kontak, dan email;
// - pemerintah: baris `profiles` ber-role pemerintah + akun login, punya nama
//   akun dan email (tanpa kontak).
// Perbedaan itu hanya pada label dan kolom tambahan; alur CRUD-nya sama.

export type AkunBaris = {
  id: string;
  name: string;
  email: string;
  contact: string | null;
  hasAccount: boolean;
  createdAt: string | null;
};

export type JenisAkun = "kontraktor" | "pemerintah";

/** Bentuk balikan API (contractor / account). */
type ApiAkun = {
  id: string;
  name: string;
  email?: string;
  hasAccount?: boolean;
};

const LABEL: Record<JenisAkun, { satuan: string; namaLabel: string; namaPlaceholder: string; buat: string }> = {
  kontraktor: {
    satuan: "kontraktor",
    namaLabel: "Nama perusahaan",
    namaPlaceholder: "PT Karya Bangun Nusantara",
    buat: "Buat akun kontraktor",
  },
  pemerintah: {
    satuan: "pemerintah",
    namaLabel: "Nama akun",
    namaPlaceholder: "Dinas Pekerjaan Umum",
    buat: "Buat akun pemerintah",
  },
};

function endpoint(jenis: JenisAkun, id?: string): string {
  const dasar = jenis === "kontraktor" ? "/api/admin/contractors" : "/api/admin/accounts";
  return id ? `${dasar}/${id}` : dasar;
}

function bacaGalat(json: unknown): string | null {
  if (json && typeof json === "object" && "error" in json) {
    const error = (json as { error?: { message?: string } }).error;
    return error?.message ?? null;
  }
  return null;
}

type FormState = {
  nama: string;
  kontak: string;
  email: string;
  kataSandi: string;
};

const KOSONG: FormState = { nama: "", kontak: "", email: "", kataSandi: "" };

function FormAkun({
  jenis,
  terbuka,
  awal,
  onTutup,
  onSukses,
}: {
  jenis: JenisAkun;
  terbuka: boolean;
  /** Terisi = mode ubah; null = mode buat. */
  awal: AkunBaris | null;
  onTutup: () => void;
  /** Baris hasil simpan (untuk memperbarui daftar di induk). */
  onSukses: (baris: AkunBaris) => void;
}) {
  const label = LABEL[jenis];
  const modeUbah = awal !== null;
  // Nilai awal diturunkan sekali saat komponen dipasang. Induk memberi `key`
  // per target, jadi pindah mode buat <-> ubah me-remount komponen ini dengan
  // nilai yang benar tanpa perlu sinkronisasi state di dalam efek.
  const [nilai, setNilai] = useState<FormState>(() =>
    awal
      ? { nama: awal.name, kontak: awal.contact ?? "", email: awal.email, kataSandi: "" }
      : KOSONG,
  );
  const [sedangProses, setSedangProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function simpan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSedangProses(true);
    setPesan(null);
    try {
      const isi: Record<string, unknown> = { nama: nilai.nama };
      if (jenis === "kontraktor") isi.kontak = nilai.kontak || null;
      if (nilai.email) isi.email = nilai.email;
      if (nilai.kataSandi) isi.password = nilai.kataSandi;
      // Mode buat selalu butuh email + kata sandi (validasi akhir di server).
      if (!modeUbah) {
        isi.email = nilai.email;
        isi.password = nilai.kataSandi;
      }

      const res = await fetch(endpoint(jenis, awal?.id), {
        method: modeUbah ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isi),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        const data = (json ?? {}) as { contractor?: ApiAkun; account?: ApiAkun };
        const api = data.contractor ?? data.account;
        onSukses({
          id: api?.id ?? awal?.id ?? "",
          name: api?.name ?? nilai.nama,
          email: api?.email ?? nilai.email,
          contact: jenis === "kontraktor" ? (nilai.kontak || null) : null,
          hasAccount: api?.hasAccount ?? true,
          createdAt: awal?.createdAt ?? new Date().toISOString(),
        });
        return;
      }
      if (res.status === 401) setPesan("Sesi berakhir. Masuk lagi.");
      else setPesan(bacaGalat(json) ?? "Terjadi kesalahan internal.");
    } catch {
      setPesan("Gagal menyimpan. Periksa koneksi lalu coba lagi.");
    } finally {
      setSedangProses(false);
    }
  }

  return (
    <Dialog
      isOpen={terbuka}
      onOpenChange={(isOpen) => {
        if (!isOpen) onTutup();
      }}
      showCloseButton={false}
    >
      <DialogHeader>
        <DialogTitle>{modeUbah ? `Ubah akun ${label.satuan}` : label.buat}</DialogTitle>
        <DialogDescription>
          {modeUbah
            ? "Kosongkan kata sandi bila tidak ingin mengubahnya."
            : `Akun login baru dengan peran ${label.satuan}.`}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={simpan} noValidate className="grid gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="akun-nama">{label.namaLabel}</Label>
          <Input
            id="akun-nama"
            value={nilai.nama}
            onChange={(e) => setNilai((v) => ({ ...v, nama: e.target.value }))}
            placeholder={label.namaPlaceholder}
            required
            maxLength={200}
          />
        </div>
        {jenis === "kontraktor" && (
          <div className="space-y-1.5">
            <Label htmlFor="akun-kontak">Kontak (opsional)</Label>
            <Input
              id="akun-kontak"
              value={nilai.kontak}
              onChange={(e) => setNilai((v) => ({ ...v, kontak: e.target.value }))}
              placeholder="operasional@perusahaan.co.id"
              maxLength={200}
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="akun-email">Email login</Label>
          <Input
            id="akun-email"
            type="email"
            autoComplete="off"
            value={nilai.email}
            onChange={(e) => setNilai((v) => ({ ...v, email: e.target.value }))}
            placeholder="nama@perusahaan.co.id"
            required={!modeUbah}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="akun-sandi">{modeUbah ? "Kata sandi baru (opsional)" : "Kata sandi awal"}</Label>
          <Input
            id="akun-sandi"
            type="password"
            autoComplete="new-password"
            value={nilai.kataSandi}
            onChange={(e) => setNilai((v) => ({ ...v, kataSandi: e.target.value }))}
            placeholder={modeUbah ? "Biarkan kosong untuk mempertahankan" : "Minimal 8 karakter"}
            minLength={8}
            required={!modeUbah}
          />
        </div>
        {pesan ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {pesan}
          </p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onTutup} isDisabled={sedangProses}>
            Batal
          </Button>
          <Button type="submit" isDisabled={sedangProses}>
            {sedangProses ? "Menyimpan…" : modeUbah ? "Simpan perubahan" : "Buat akun"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function KonfirmasiHapus({
  jenis,
  target,
  onTutup,
  onSukses,
}: {
  jenis: JenisAkun;
  target: AkunBaris | null;
  onTutup: () => void;
  onSukses: () => void;
}) {
  const [sedangHapus, setSedangHapus] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function hapus() {
    if (!target) return;
    setSedangHapus(true);
    setPesan(null);
    try {
      const res = await fetch(endpoint(jenis, target.id), { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        onSukses();
        return;
      }
      if (res.status === 401) setPesan("Sesi berakhir. Masuk lagi.");
      else setPesan(bacaGalat(json) ?? "Gagal menghapus akun. Coba lagi.");
    } catch {
      setPesan("Gagal menghapus akun. Coba lagi.");
    } finally {
      setSedangHapus(false);
    }
  }

  return (
    <Dialog
      isOpen={target !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setPesan(null);
          onTutup();
        }
      }}
      showCloseButton={false}
    >
      <DialogHeader>
        <DialogTitle>Hapus akun {LABEL[jenis].satuan}?</DialogTitle>
        <DialogDescription>
          Akun{" "}
          <span className="font-semibold text-foreground">
            {target?.name ?? ""}
            {target?.email ? ` (${target.email})` : ""}
          </span>{" "}
          akan dihapus permanen beserta akses login-nya. Tindakan ini tidak bisa dibatalkan.
        </DialogDescription>
      </DialogHeader>
      {pesan ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {pesan}
        </p>
      ) : null}
      <DialogFooter>
        <Button variant="outline" onClick={onTutup} isDisabled={sedangHapus}>
          Batal
        </Button>
        <Button variant="destructive" onClick={() => void hapus()} isDisabled={sedangHapus}>
          {sedangHapus ? "Menghapus…" : "Hapus akun"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

const IKON_AKSI =
  "inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export function KelolaAkun({ jenis, awal }: { jenis: JenisAkun; awal: AkunBaris[] }) {
  const label = LABEL[jenis];
  // Daftar disimpan di state lokal dan diperbarui dari respons API. Versi
  // sebelumnya memanggil router.refresh(), yang me-render ulang pohon server
  // tepat saat modal hendak ditutup sehingga dialog tertinggal terbuka.
  const [daftar, setDaftar] = useState<AkunBaris[]>(awal);
  const [formTerbuka, setFormTerbuka] = useState(false);
  const [targetUbah, setTargetUbah] = useState<AkunBaris | null>(null);
  const [targetHapus, setTargetHapus] = useState<AkunBaris | null>(null);

  const urutNama = (rows: AkunBaris[]) =>
    [...rows].sort((a, b) => a.name.localeCompare(b.name, "id"));

  function tutupForm() {
    setFormTerbuka(false);
    setTargetUbah(null);
  }

  function tutupHapus() {
    setTargetHapus(null);
  }

  return (
    <section aria-labelledby="judul-akun">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="judul-akun" className="font-heading text-lg font-semibold tracking-tight">
            Akun {label.satuan}
          </h2>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {jenis === "kontraktor"
              ? "Akun pelaksana. Kontraktor hanya melihat proyek yang ditugaskan kepadanya."
              : "Akun instansi pemerintah. Melihat seluruh proyek wilayah kerja."}
          </p>
        </div>
        <Button onClick={() => setFormTerbuka(true)}>{label.buat}</Button>
      </div>

      {daftar.length === 0 ? (
        <p className="mt-4 rounded-lg border border-border bg-card px-4 py-6 text-sm text-muted-foreground shadow-sm">
          Belum ada akun {label.satuan}. Buat yang pertama lewat tombol di atas.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {jenis === "kontraktor" && (
                    <th className="px-3 py-3 text-xs font-medium text-muted-foreground">Nama perusahaan</th>
                  )}
                  {jenis === "pemerintah" && (
                    <th className="px-3 py-3 text-xs font-medium text-muted-foreground">Nama akun</th>
                  )}
                  <th className="px-3 py-3 text-xs font-medium text-muted-foreground">Email login</th>
                  {jenis === "kontraktor" && (
                    <th className="hidden px-3 py-3 text-xs font-medium text-muted-foreground lg:table-cell">
                      Kontak
                    </th>
                  )}
                  <th className="px-3 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="hidden px-3 py-3 text-xs font-medium text-muted-foreground xl:table-cell">
                    Dibuat
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((akun) => (
                  <tr
                    key={akun.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-3 py-4 font-medium">{akun.name}</td>
                    <td className="px-3 py-4 font-mono text-xs text-muted-foreground">
                      {akun.email || "—"}
                    </td>
                    {jenis === "kontraktor" && (
                      <td className="hidden px-3 py-4 text-sm text-muted-foreground lg:table-cell">
                        {akun.contact ?? "—"}
                      </td>
                    )}
                    <td className="px-3 py-4">
                      {akun.hasAccount ? (
                        <Badge>Akun aktif</Badge>
                      ) : (
                        <Badge variant="outline">Tanpa akun</Badge>
                      )}
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-muted-foreground xl:table-cell">
                      {akun.createdAt ? new Date(akun.createdAt).toLocaleDateString("id-ID") : "—"}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Ubah akun ${akun.name}`}
                          title="Ubah akun"
                          onClick={() => setTargetUbah(akun)}
                          className={IKON_AKSI}
                        >
                          <HugeiconsIcon icon={PencilEdit01Icon} className="size-4.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Hapus akun ${akun.name}`}
                          title="Hapus akun"
                          onClick={() => setTargetHapus(akun)}
                          className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* key memaksa FormAkun dipasang ulang per target: state internal
          (nilai form, pesan) tidak terbawa antar buka/tutup. */}
      <FormAkun
        key={targetUbah?.id ?? "baru"}
        jenis={jenis}
        terbuka={formTerbuka || targetUbah !== null}
        awal={targetUbah}
        onTutup={tutupForm}
        onSukses={(baris) => {
          setDaftar((rows) => urutNama([...rows.filter((r) => r.id !== baris.id), baris]));
          tutupForm();
        }}
      />
      <KonfirmasiHapus
        jenis={jenis}
        target={targetHapus}
        onTutup={tutupHapus}
        onSukses={() => {
          const id = targetHapus?.id;
          setDaftar((rows) => rows.filter((r) => r.id !== id));
          tutupHapus();
        }}
      />
    </section>
  );
}