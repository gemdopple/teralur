"use client";

import { useState } from "react";
import { teksSiapBagikan } from "@/lib/share-text";

// P1 §3: tombol "Salin teks siap-bagikan untuk WhatsApp" pada dossier dan
// kartu bukti. Teks dibangun saat tombol ditekan — URL absolut diambil dari
// location.origin supaya benar di localhost maupun domain produksi. Bila
// Clipboard API tak tersedia, teks ditampilkan utuh untuk disalin manual.

type Props = {
  packageName: string;
  statusLabel: string;
  ringCaption: string;
  ringNote: string | null;
  demo: boolean;
  snapshotDate: string | null;
  /** Path dossier, mis. "/dossiers/abc123". */
  dossierPath: string;
};

export function TombolSalinBagikan(props: Props) {
  const [status, setStatus] = useState("");
  const [teksGagal, setTeksGagal] = useState<string | null>(null);

  const salin = async () => {
    const teks = teksSiapBagikan({
      packageName: props.packageName,
      statusLabel: props.statusLabel,
      ringCaption: props.ringCaption,
      ringNote: props.ringNote,
      demo: props.demo,
      snapshotDate: props.snapshotDate,
      url: `${window.location.origin}${props.dossierPath}`,
    });
    try {
      await navigator.clipboard.writeText(teks);
      setTeksGagal(null);
      setStatus("Teks tersalin. Tempel di WhatsApp.");
    } catch {
      // Fallback peramban tanpa Clipboard API: tampilkan teks untuk salin manual.
      setTeksGagal(teks);
      setStatus("Teks di bawah; salin manual bila perlu.");
    }
  };

  return (
    <div>
      {/* Tombol pil garis luar. */}
      <button
        type="button"
        onClick={salin}
        className="inline-flex min-h-10 items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
      >
        Salin teks siap-bagikan (WhatsApp)
      </button>
      {status && (
        <span role="status" className="ml-3 text-sm text-muted-foreground">
          {status}
        </span>
      )}
      {teksGagal && (
        <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl border border-border bg-muted/50 p-3 text-sm">
          {teksGagal}
        </pre>
      )}
    </div>
  );
}
