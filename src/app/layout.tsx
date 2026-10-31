import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { PenyediaTema } from "@/components/teralur/penyedia-tema";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistHeading = Geist({
  subsets: ["latin"],
  variable: "--font-heading",
});

const deskripsi =
  "Periksa informasi papan proyek publik terhadap catatan pengadaan resmi dengan sumber dan batas yang jelas.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Teralur: Transparansi Proyek Publik",
    template: "%s · Teralur",
  },
  description: deskripsi,
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Teralur",
    title: "Teralur: Transparansi Proyek Publik",
    description: deskripsi,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FCFCFA" },
    { media: "(prefers-color-scheme: dark)", color: "#14110F" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        geistSans.variable,
        geistHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <PenyediaTema>{children}</PenyediaTema>
        <Toaster />
      </body>
    </html>
  );
}
