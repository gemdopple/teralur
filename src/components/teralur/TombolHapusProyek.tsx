"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Dialog hapus proyek (alur pemerintah/admin): konfirmasi dulu, lalu panggil
// DELETE /api/admin/projects/[id] (hapus lunak, E.7) dan segarkan daftar.
// Dikendalikan dari luar agar bisa dibuka dari mana saja — mis. item menu
// "..." pada baris daftar proyek dasbor.

export function DialogHapusProyek({
  projectId,
  nama,
  terbuka,
  saatTertutup,
}: {
  projectId: string;
  nama: string;
  terbuka: boolean;
  saatTertutup: () => void;
}) {
  const router = useRouter();
  const [sedangHapus, setSedangHapus] = useState(false);
  const [pesanGalat, setPesanGalat] = useState<string | null>(null);

  async function hapus() {
    setSedangHapus(true);
    setPesanGalat(null);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, { method: "DELETE" });
      if (res.ok) {
        saatTertutup();
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
    <Dialog isOpen={terbuka} onOpenChange={(terbukaBaru) => !terbukaBaru && saatTertutup()} showCloseButton={false}>
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
        <Button variant="outline" onClick={saatTertutup} isDisabled={sedangHapus}>
          Batal
        </Button>
        <Button variant="destructive" onClick={() => void hapus()} isDisabled={sedangHapus}>
          {sedangHapus ? "Menghapus…" : "Hapus proyek"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
