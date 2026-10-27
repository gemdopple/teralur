import Link from "next/link";

const KOLOM: Array<{ judul: string; tautan: Array<{ href: string; label: string }> }> = [
  {
    judul: "Produk",
    tautan: [
      { href: "/jelajah", label: "Jelajah peta proyek" },
      { href: "/examples", label: "Contoh kasus" },
      { href: "/search", label: "Cari paket" },
    ],
  },
  {
    judul: "Transparansi",
    tautan: [
      { href: "/methodology", label: "Metodologi" },
      { href: "/about", label: "Tentang Teralur" },
      { href: "/login", label: "Masuk pengelola" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto grid w-full max-w-6xl gap-x-10 gap-y-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5" aria-label="Teralur, ke beranda">
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-[0.6rem] bg-kuning-papan font-heading text-lg leading-none font-bold text-hitam-aspal"
            >
              t
            </span>
            <span className="font-heading text-lg font-bold tracking-tight">teralur</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            Jejak proyek publik yang lebih mudah diperiksa warga: bandingkan data papan dengan
            catatan pengadaan resmi, lengkap dengan sumber dan batasnya.
          </p>
        </div>
        {KOLOM.map((kolom) => (
          <nav key={kolom.judul} aria-label={kolom.judul}>
            <h2 className="text-sm font-semibold text-foreground">{kolom.judul}</h2>
            {/* Fleksibel (bukan space-y): setiap tautan punya tinggi sentuh
                44px sendiri tanpa merenggangkan daftar terlalu jauh. */}
            <ul className="mt-2 flex flex-col text-sm text-muted-foreground">
              {kolom.tautan.map((tautan) => (
                <li key={tautan.href}>
                  <Link
                    href={tautan.href}
                    className="flex min-h-11 items-center transition-colors hover:text-foreground"
                  >
                    {tautan.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs leading-5 text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>
            Sumber data: catatan pengadaan terbuka OCDS, publikasi Opentender oleh ICW, mengikuti
            lisensi ODbL.
          </p>
          <p className="shrink-0">© 2026 Teralur — proyek lomba.</p>
        </div>
      </div>
    </footer>
  );
}
