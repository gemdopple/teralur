import Link from "next/link";
import { cn } from "@/lib/utils";

// Logo Teralur — tile gradasi brand (FFD650 → F5BC00) dari public/TeralurLogo.svg,
// digambar inline agar tajam di semua ukuran dan ikut tema lewat kata "teralur".
// Satu-satunya sumber logo: header publik, sidebar dasbor, dan halaman login
// memakai komponen ini (tidak ada lagi rekreasi inline).
const JALUR_T = "M56.904 124.832C54.472 124.832 52.488 123.979 50.952 122.272C49.416 120.565 48.8827 118.496 49.352 116.064L61.32 47.968H100.616L88.2 118.624C87.9013 120.288 87.0053 121.739 85.512 122.976C84.0187 124.213 82.3547 124.832 80.52 124.832H56.904ZM34.824 64.736C32.6907 64.736 30.984 63.9893 29.704 62.496C28.424 61.0027 27.976 59.2533 28.36 57.248L31.752 37.792C32.008 36.2987 32.776 35.0187 34.056 33.952C35.336 32.8853 36.7227 32.352 38.216 32.352H126.408C128.584 32.352 130.291 33.0987 131.528 34.592C132.808 36.0853 133.277 37.856 132.936 39.904L129.48 59.296C129.224 60.7893 128.456 62.0693 127.176 63.136C125.896 64.2027 124.509 64.736 123.016 64.736H34.824Z";

export function UbinLogo({ ukuran = 36, className }: { ukuran?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 156 156"
      width={ukuran}
      height={ukuran}
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect width="156" height="156" rx="40" fill="url(#teralur-linier)" />
      <rect width="156" height="156" rx="40" fill="url(#teralur-radial)" fillOpacity="0.2" />
      <path d={JALUR_T} fill="white" fillOpacity="0.95" />
      <defs>
        <linearGradient id="teralur-linier" x1="78" y1="0" x2="78" y2="156" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD650" />
          <stop offset="1" stopColor="#F5BC00" />
        </linearGradient>
        <radialGradient
          id="teralur-radial"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(78 78) rotate(90) scale(78)"
        >
          <stop stopColor="#FFD650" />
          <stop offset="1" stopColor="#F5BC00" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function LogoTeralur({
  ukuran = 36,
  denganTeks = true,
  href = "/",
  className,
}: {
  ukuran?: number;
  denganTeks?: boolean;
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Teralur — ke beranda"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <UbinLogo ukuran={ukuran} />
      {denganTeks ? (
        <span className="font-heading text-lg font-bold tracking-tight text-foreground">
          teralur
        </span>
      ) : null}
    </Link>
  );
}
