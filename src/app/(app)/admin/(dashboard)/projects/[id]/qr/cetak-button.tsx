"use client";

import { Button } from "@/components/ui/button";

// Tombol Cetak (Lampiran K.2): butuh interaksi klien (window.print()).
export function CetakButton() {
  return (
    <Button type="button" className="no-print" onClick={() => window.print()}>
      Cetak
    </Button>
  );
}
