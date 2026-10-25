"use client";

import jsQR from "jsqr";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { QrCodeScanIcon } from "@hugeicons/core-free-icons";
import { kelasTombol } from "@/lib/kelas-tombol";
import { cn } from "@/lib/utils";

// Pemindai QR di dalam situs: warga menekan "Buka kamera", mengarahkan kamera
// ke QR pada papan proyek, dan halaman membuka dossier proyek tersebut.
// Dekode memakai BarcodeDetector bila tersedia, selebihnya jsQR pada kanvas
// luring. Aliran kamera dihentikan penuh saat tutup, berhasil baca, atau unmount.

type BacaanBarcode = { rawValue: string };
type DetektorBarcode = {
  detect: (sumber: HTMLVideoElement) => Promise<BacaanBarcode[]>;
};
type KelasDetektorBarcode = new (opsi?: {
  formats?: string[];
}) => DetektorBarcode;

type StatusPindai = "idle" | "membuka" | "memindai" | "ditolak" | "tanpaKamera" | "gagal";

// Pesan galat per keadaan (aman kata-terlarang).
const PESAN_GALAT: Record<Exclude<StatusPindai, "idle" | "membuka" | "memindai">, string> = {
  ditolak:
    "Izin kamera ditolak. Aktifkan izin kamera pada browser Anda, lalu coba lagi.",
  tanpaKamera: "Kamera tidak ditemukan pada perangkat ini.",
  gagal: "Kamera gagal dibuka. Coba lagi beberapa saat.",
};

// Tautan dossier: path /dossiers/<slug> pada URL apa pun, atau slug tunggal.
const POLA_JALUR = /^\/dossiers\/([A-Za-z0-9_-]{8,24})$/;
const POLA_SLUG = /^[A-Za-z0-9_-]{8,24}$/;

function tandaiTautanDossier(mentah: string): string | null {
  try {
    const url = new URL(mentah);
    const cocok = POLA_JALUR.exec(url.pathname);
    if (cocok) return `/dossiers/${cocok[1]}`;
  } catch {
    // Bukan URL absolut — lanjut uji pola slug langsung di bawah.
  }
  if (POLA_SLUG.test(mentah)) return `/dossiers/${mentah}`;
  return null;
}

function pesanUntuk(status: StatusPindai): string | undefined {
  return status === "ditolak" || status === "tanpaKamera" || status === "gagal"
    ? PESAN_GALAT[status]
    : undefined;
}

export function PemindaiQr() {
  const router = useRouter();
  const kurangiGerak = useReducedMotion();

  const [status, setStatus] = useState<StatusPindai>("idle");
  const [tautanAsing, setTautanAsing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const kanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detektorRef = useRef<DetektorBarcode | null>(null);
  const terbukaRef = useRef(false);
  const selesaiRef = useRef(false);
  const waktuDeteksiRef = useRef(0);

  // Hentikan seluruh jejak kamera: batalkan putaran decode, matikan semua
  // track, dan lepas sumber video. Dipakai tombol tutup, bacaan sukses,
  // dan pembersihan unmount.
  const hentikanSemua = useCallback(() => {
    terbukaRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      for (const jalur of streamRef.current.getTracks()) jalur.stop();
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video?.srcObject) video.srcObject = null;
  }, []);

  const tutupKamera = useCallback(() => {
    hentikanSemua();
    setStatus("idle");
  }, [hentikanSemua]);

  useEffect(() => {
    return () => hentikanSemua();
  }, [hentikanSemua]);

  const prosesBacaan = useCallback(
    (mentah: string) => {
      if (selesaiRef.current || !terbukaRef.current) return;
      selesaiRef.current = true;
      hentikanSemua();

      const tautan = tandaiTautanDossier(mentah);
      if (tautan) {
        router.push(tautan);
      } else {
        setStatus("idle");
        setTautanAsing(true);
      }
    },
    [hentikanSemua, router],
  );

  const bukaKamera = useCallback(async () => {
    setTautanAsing(false);
    setStatus("membuka");
    terbukaRef.current = true;
    selesaiRef.current = false;
    waktuDeteksiRef.current = 0;

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("gagal");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      // Pengguna bisa menutup pemindai selama dialog izin terbuka.
      if (!terbukaRef.current) {
        for (const jalur of stream.getTracks()) jalur.stop();
        return;
      }
      streamRef.current = stream;

      // BarcodeDetector bila ada; selain itu putaran memakai jsQR.
      if ("BarcodeDetector" in window) {
        const Kelas = (window as unknown as {
          BarcodeDetector?: KelasDetektorBarcode;
        }).BarcodeDetector;
        try {
          detektorRef.current = Kelas ? new Kelas({ formats: ["qr_code"] }) : null;
        } catch {
          detektorRef.current = null;
        }
      }

      const video = videoRef.current;
      if (!video) {
        hentikanSemua();
        setStatus("gagal");
        return;
      }
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        // Pemutaran otomatis sudah dicover atribut muted + autoplay.
      }

      setStatus("memindai");

      // Putaran decode via requestAnimationFrame; dibatasi ~1x/130ms agar
      // hemat baterai. Frame berikutnya dijadwalkan lebih dulu supaya
      // hentikanSemua() selalu bisa membatalkan id terbaru.
      const putaran = () => {
        rafRef.current = requestAnimationFrame(putaran);
        const videoSaatIni = videoRef.current;
        if (!videoSaatIni || videoSaatIni.readyState < videoSaatIni.HAVE_CURRENT_DATA) {
          return;
        }
        const kini = performance.now();
        if (kini - waktuDeteksiRef.current < 130) return;
        waktuDeteksiRef.current = kini;

        const detektor = detektorRef.current;
        if (detektor) {
          detektor
            .detect(videoSaatIni)
            .then((bacaan) => {
              const hasil = bacaan.find((b) => b.rawValue);
              if (hasil) prosesBacaan(hasil.rawValue);
            })
            .catch(() => {
              // Gagal pada satu frame wajar (fokus, blur) — coba lagi.
            });
          return;
        }

        const lebar = videoSaatIni.videoWidth;
        const tinggi = videoSaatIni.videoHeight;
        if (!lebar || !tinggi) return;
        const skala = Math.min(1, 640 / lebar);
        const w = Math.max(1, Math.round(lebar * skala));
        const h = Math.max(1, Math.round(tinggi * skala));
        const kanvas =
          kanvasRef.current ?? (kanvasRef.current = document.createElement("canvas"));
        kanvas.width = w;
        kanvas.height = h;
        const konteks = kanvas.getContext("2d", { willReadFrequently: true });
        if (!konteks) return;
        konteks.drawImage(videoSaatIni, 0, 0, w, h);
        const citra = konteks.getImageData(0, 0, w, h);
        const hasil = jsQR(citra.data, w, h);
        if (hasil?.data) prosesBacaan(hasil.data);
      };
      putaran();
    } catch (galat) {
      const nama = galat instanceof DOMException ? galat.name : "";
      if (nama === "NotAllowedError" || nama === "PermissionDeniedError") {
        setStatus("ditolak");
      } else if (nama === "NotFoundError" || nama === "DevicesNotFoundError") {
        setStatus("tanpaKamera");
      } else {
        setStatus("gagal");
      }
    }
  }, [hentikanSemua, prosesBacaan]);

  const kameraTerlihat = status === "membuka" || status === "memindai";
  const pesanGalat = pesanUntuk(status);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3.5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-kuning-papan text-hitam-aspal">
          <HugeiconsIcon icon={QrCodeScanIcon} className="size-5" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold tracking-tight">
            Pindai QR di papan proyek
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Pindai QR yang tertempel pada papan proyek untuk langsung membuka
            laporannya.
          </p>
        </div>
      </div>

      <div
        className={cn(
          "relative mt-5 overflow-hidden rounded-xl bg-hitam-aspal",
          !kameraTerlihat && "hidden",
        )}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="aspect-[4/3] w-full object-cover"
        />
        {/* Bingkai bidik: empat sudut membulat warna kuning papan */}
        <span
          aria-hidden
          className="absolute left-3 top-3 h-10 w-10 rounded-tl-lg border-l-2 border-t-2 border-kuning-papan"
        />
        <span
          aria-hidden
          className="absolute right-3 top-3 h-10 w-10 rounded-tr-lg border-r-2 border-t-2 border-kuning-papan"
        />
        <span
          aria-hidden
          className="absolute bottom-3 left-3 h-10 w-10 rounded-bl-lg border-b-2 border-l-2 border-kuning-papan"
        />
        <span
          aria-hidden
          className="absolute bottom-3 right-3 h-10 w-10 rounded-br-lg border-b-2 border-r-2 border-kuning-papan"
        />
      </div>

      {(kameraTerlihat || pesanGalat || tautanAsing) && (
        <div className="mt-3.5 min-h-6 text-sm">
          {status === "membuka" && (
            <p className="text-muted-foreground">Menyiapkan kamera…</p>
          )}
          {status === "memindai" && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <motion.span
                aria-hidden
                className="size-2 rounded-full bg-kuning-papan"
                animate={kurangiGerak ? undefined : { opacity: [1, 0.35, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
              Arahkan kamera ke QR pada papan proyek…
            </p>
          )}
          {pesanGalat && (
            <p className="rounded-xl border border-selisih/30 bg-selisih/10 px-3 py-2 text-selisih">
              {pesanGalat}
            </p>
          )}
          {tautanAsing && (
            <p className="rounded-xl border border-netral/30 bg-netral/10 px-3 py-2 text-netral">
              QR ini bukan tautan Teralur.
            </p>
          )}
        </div>
      )}

      <div className="mt-5">
        {kameraTerlihat ? (
          <button type="button" onClick={tutupKamera} className={kelasTombol("outline")}>
            Tutup kamera
          </button>
        ) : (
          <button type="button" onClick={bukaKamera} className={kelasTombol("default")}>
            Buka kamera
          </button>
        )}
      </div>
    </div>
  );
}
