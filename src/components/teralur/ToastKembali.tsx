"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

// Pemberitahuan 404/galat ringkas (permintaan PM 2026-10-31): alih-alih
// halaman galat penuh, tampilkan toast lalu kembali ke halaman sebelumnya.
// Pendaratan langsung (QR lama, tautan eksternal — tanpa referrer) tidak
// punya halaman sebelumnya, jadi diarahkan ke beranda agar tidak jalan di
// tempat. Toast bertahan lintas navigasi karena <Toaster> ada di layout akar.
export function ToastKembali({ pesan }: { pesan: string }) {
  const router = useRouter();

  useEffect(() => {
    toast.error(pesan);
    if (document.referrer) {
      router.back();
    } else {
      router.replace("/");
    }
  }, [pesan, router]);

  // Halaman sengaja kosong — pemberitahuannya ada pada toast.
  return null;
}
