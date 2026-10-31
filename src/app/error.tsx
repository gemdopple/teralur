"use client";

import { useEffect } from "react";
import { ToastKembali } from "@/components/teralur/ToastKembali";

// Batas galat rute (error.tsx): sama polanya dengan 404 — toast + kembali ke
// halaman sebelumnya. Galat dicatat ke konsol agar tetap telusuri di dev;
// digest disertakan bila ada untuk pencocokan log server.
export default function GalatRute({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error.digest ? `[${error.digest}] ${error.message}` : error.message);
  }, [error]);

  return <ToastKembali pesan="Terjadi kesalahan tak terduga." />;
}
