"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

// Lampiran I.3: tombol "Keluar" memanggil signOut() lalu menuju /admin/login.
export function KeluarButton({ className }: { className?: string }) {
  const router = useRouter();
  const [sedangKeluar, setSedangKeluar] = useState(false);

  async function keluar() {
    setSedangKeluar(true);
    try {
      const supabase = await getSupabaseBrowser();
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <Button variant="outline" onClick={keluar} isDisabled={sedangKeluar} className={className}>
      {sedangKeluar ? "Memproses…" : "Keluar"}
    </Button>
  );
}
