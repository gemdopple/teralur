"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Tombol hapus proyek (alur pemerintah): konfirmasi dulu, lalu panggil
// DELETE /api/admin/projects/[id] (hapus lunak, E.7) dan segarkan daftar.
// Dipakai pada baris "Proyek tersimpan" di dasbor pemerintah.

export function TombolHapusProyek({ projectId, nama }: { projectId: string; nama: string }) {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const [sedangHapus, setSedangHapus] = useState(false);
  const [pesanGalat, setPesanGalat] = useState<string | null>(null);

  async function hapus() {
    setSedangHapus(true);
    setPesanGalat(null);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, { method: "DELETE" });
      if (res.ok) {
        setTerbuka(false);
        router.refresh();
      } else if (res.status === 401) {
        setPesanGalat("Sesi berakhir. Masuk lagi.");
      } else {
        setPesanGalat("Gagal menghapus proyek. Coba lagi.");
      }
    } catch {
      setPesanGalat("Gagal menghapus proyek. Coba lagi.");
    } finally {
      setSedangHapus(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Hapus proyek ${nama}`}
        title="Hapus proyek"
        onClick={() => setTerbuka(true)}
        className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <HugeiconsIcon icon={Delete02Icon} className="size-4.5" />
      </button>

      <Dialog isOpen={terbuka} onOpenChange={setTerbuka} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Hapus proyek?</DialogTitle>
          <DialogDescription>
            &quot;{nama}&quot; tidak akan tampil lagi di situs. QR yang sudah dicetak akan
            menampilkan pesan &quot;sedang ditinjau&quot;. Lanjutkan?
          </DialogDescription>
        </DialogHeader>
        {pesanGalat ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {pesanGalat}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => setTerbuka(false)} isDisabled={sedangHapus}>
            Batal
          </Button>
          <Button variant="destructive" onClick={() => void hapus()} isDisabled={sedangHapus}>
            {sedangHapus ? "Menghapus…" : "Hapus proyek"}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
