import type { Metadata } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SiteFooter } from "@/components/teralur/SiteFooter";
import { SiteHeader } from "@/components/teralur/SiteHeader";

const archivoHeading = Archivo({
  subsets: ["latin"],
  weight: "800",
  variable: "--font-heading",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "Teralur: Transparansi Proyek Publik",
  description:
    "Periksa informasi papan proyek publik terhadap catatan pengadaan resmi dengan sumber dan batas yang jelas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        inter.variable,
        archivoHeading.variable,
        jetbrainsMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
