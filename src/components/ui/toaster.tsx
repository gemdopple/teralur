"use client"

import { Toaster as HotToaster } from "react-hot-toast"

// Pembungkus react-hot-toast dengan tampilan teralur: kartu popover, ikon
// sukses/galat memakai token status merek. Posisi atas-tengah agar tidak
// menutupi tombol melayang laporan warga maupun lembar bawah di ponsel.
export function Toaster() {
  return (
    <HotToaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--popover)",
          color: "var(--popover-foreground)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          boxShadow: "0 8px 24px rgb(20 17 15 / 0.14)",
          fontSize: "0.875rem",
          padding: "10px 14px",
        },
        success: {
          iconTheme: { primary: "var(--cocok)", secondary: "#FFFFFF" },
        },
        error: {
          duration: 6000,
          iconTheme: { primary: "var(--selisih)", secondary: "#FFFFFF" },
        },
      }}
    />
  )
}
