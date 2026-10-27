"use client";

import { Button } from "@/components/ui/button";

// Tombol Cetak (Lampiran K.2): butuh interaksi klien (window.print()).
// Dipakai lembar QR admin dan lembar papan proyek dasbor.
export function TombolCetak({ label = "Cetak" }: { label?: string }) {
  return (
    <Button type="button" className="no-print" onClick={() => window.print()}>
      {label}
    </Button>
  );
}
