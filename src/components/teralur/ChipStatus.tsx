import type { Status } from "@/lib/match/types";

export type DossierStatus = Status | "catatan_resmi";

// Diekspor untuk membangun teks siap-bagikan (lib/share-text dipakai TombolSalinBagikan).
export const TEKS_STATUS: Record<DossierStatus, string> = {
  cocok: "Cocok dengan catatan resmi",
  selisih: "Selisih data, perlu klarifikasi",
  tidak_ditemukan: "Tidak ditemukan di data yang kami miliki",
  catatan_resmi: "Catatan resmi",
};

// Chip pil (rounded-full): bingkai bernuansa status dengan latar tipis —
// hijau untuk cocok, oranye #D9480F untuk selisih, abu netral untuk sisanya.
const KELAS_STATUS: Record<DossierStatus, string> = {
  cocok: "border-cocok/30 bg-cocok/10 text-cocok",
  selisih: "border-selisih/30 bg-selisih/10 text-selisih",
  tidak_ditemukan: "border-netral/30 bg-netral/10 text-netral",
  catatan_resmi: "border-netral/30 bg-card text-netral",
};

export type ChipStatusProps = {
  status: DossierStatus;
  className?: string;
};

export function ChipStatus({ status, className }: ChipStatusProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${KELAS_STATUS[status]}${className ? ` ${className}` : ""}`}
    >
      {TEKS_STATUS[status]}
    </span>
  );
}
