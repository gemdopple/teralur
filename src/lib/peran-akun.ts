import type { AppRole } from "@/lib/roles";

// Logika peran murni (tanpa I/O, tanpa server-only) agar dapat diuji unit —
// pola sama dengan schemas.ts / roles.ts. Modul identitas server (identitas.ts)
// memakai fungsi-fungsi ini untuk menerjemahkan baris `profiles` + allowlist
// admin menjadi peran efektif dan id kontraktor.

/** Daftar email admin dari env (dipisah koma, dirapikan, huruf kecil). */
export function daftarAdminDari(env: string | undefined): string[] {
  return (env ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export type BarisProfil = { role: string; contractor_id: string | null } | null;

function peranValid(nilai: string): nilai is AppRole {
  return nilai === "pemerintah" || nilai === "kontraktor" || nilai === "admin";
}

/**
 * Peran efektif dari baris `profiles` (murni).
 * - Baris profil dengan role valid -> role itu.
 * - Tanpa baris (atau role tak dikenal) -> admin bila email ada di allowlist,
 *   selain itu pemerintah (peran bawaan paling sedikit haknya).
 */
export function peranEfektif(
  profil: BarisProfil,
  email: string | null,
  daftarAdmin: string[],
): AppRole {
  if (profil && peranValid(profil.role)) return profil.role;
  const surel = email?.toLowerCase() ?? "";
  if (surel && daftarAdmin.includes(surel)) return "admin";
  return "pemerintah";
}

/**
 * Id kontraktor efektif: hanya untuk peran 'kontraktor'. Selain itu null —
 * sehingga penyaringan proyek tidak pernah membocorkan penugasan ke non-kontraktor.
 */
export function contractorIdEfektif(profil: BarisProfil): string | null {
  if (!profil || profil.role !== "kontraktor") return null;
  return profil.contractor_id;
}