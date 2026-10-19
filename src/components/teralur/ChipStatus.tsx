import type { Status } from "@/lib/match/types";

const TEKS_STATUS: Record<Status, string> = {
  cocok: "Cocok dengan catatan resmi",
  selisih: "Selisih data, perlu klarifikasi",
  tidak_ditemukan: "Tidak ditemukan di data yang kami miliki",
};

const KELAS_STATUS: Record<Status, string> = {
  cocok: "border-cocok/30 bg-cocok/10 text-cocok",
  selisih: "border-selisih/30 bg-selisih/10 text-selisih",
  tidak_ditemukan: "border-netral/30 bg-netral/10 text-netral",
};

export type ChipStatusProps = {
  status: Status;
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
