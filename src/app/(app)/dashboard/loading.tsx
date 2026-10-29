import { Skeleton } from "@/components/ui/skeleton";

// Rangka muat dasbor: fallback navigasi untuk seluruh segmen /dashboard
// (docs loading.md — fallback loading.tsx ikut di-prefetch, jadi perpindahan
// halaman menampilkan kerangka ini seketika sementara sesi + data halaman
// masih dihitung di server; sebelumnya navigasi membeku tanpa umpan balik).
// Bentuknya meniru KepalaDasbor + kisi kartu ringkasan agar konten tidak
// "melompat" saat selesai dimuat. Sengaja statis — tanpa API dinamis — supaya
// bisa jadi bagian dari shell yang di-prerender.
export default function Loading() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border bg-card px-4 py-6 sm:px-6">
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="mt-4 h-64 rounded-lg" />
      </div>
    </>
  );
}
