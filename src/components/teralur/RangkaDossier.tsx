import { Skeleton } from "@/components/ui/skeleton";

// Rangka muat dossier/kartu bukti: fallback navigasi segmen /dossiers/[slug]
// dan /evidence/[slug] (dipakai loading.tsx keduanya — docs loading.md:
// fallback ikut di-prefetch agar navigasi langsung menampilkan sesuatu,
// sementara data dossier masih diambil server). Bentuknya meniru kepala
// DossierProyek (status chip + judul besar + kartu konten) supaya peralihan
// ke konten sungguhan tidak melompat. Sengaja statis agar bisa di-prerender
// sebagai bagian shell.
export function RangkaDossier() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <header>
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="mt-4 h-9 w-full max-w-2xl" />
        <Skeleton className="mt-3 h-4 w-64" />
      </header>
      <div className="mt-8 space-y-4">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </main>
  );
}
