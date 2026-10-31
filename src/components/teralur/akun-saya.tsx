"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout03Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

// Kartu akun pengelola: ganti kata sandi (dengan verifikasi kata sandi saat
// ini lewat signInWithPassword — re-auth ringan sebelum updateUser) dan
// keluar dari perangkat. Dipecah dua agar halaman /dashboard/akun bisa
// menyusunnya berdampingan di layar lebar tanpa ruang kosong.

export function FormKataSandi({ email }: { email: string }) {
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [sedangProses, setSedangProses] = useState(false);

  async function gantiKataSandi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (baru.length < 8) {
      toast.error("Kata sandi baru minimal 8 karakter.");
      return;
    }
    if (baru !== konfirmasi) {
      toast.error("Konfirmasi kata sandi tidak sama.");
      return;
    }
    setSedangProses(true);
    try {
      const supabase = await getSupabaseBrowser();
      // Re-auth: verifikasi kata sandi saat ini sebelum mengganti, supaya
      // perangkat yang ditinggal dalam keadaan masuk tidak bisa mengganti
      // kata sandi tanpa mengetahui yang lama.
      const { error: galatMasuk } = await supabase.auth.signInWithPassword({
        email,
        password: lama,
      });
      if (galatMasuk) {
        toast.error("Kata sandi saat ini salah.");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: baru });
      if (error) {
        toast.error("Gagal memperbarui kata sandi. Coba lagi.");
        return;
      }
      toast.success("Kata sandi diperbarui.");
      setLama("");
      setBaru("");
      setKonfirmasi("");
    } finally {
      setSedangProses(false);
    }
  }

  return (
    <section className="h-fit rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-heading text-base font-semibold tracking-tight">Ganti kata sandi</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Verifikasi kata sandi saat ini dulu, lalu tentukan kata sandi baru.
      </p>
      <form onSubmit={gantiKataSandi} className="mt-4 space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="kata-sandi-lama">Kata sandi saat ini</Label>
          <Input
            id="kata-sandi-lama"
            type="password"
            autoComplete="current-password"
            required
            value={lama}
            onChange={(e) => setLama(e.target.value)}
            disabled={sedangProses}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kata-sandi-baru">Kata sandi baru</Label>
          <Input
            id="kata-sandi-baru"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={baru}
            onChange={(e) => setBaru(e.target.value)}
            disabled={sedangProses}
          />
          <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="kata-sandi-konfirmasi">Konfirmasi kata sandi baru</Label>
          <Input
            id="kata-sandi-konfirmasi"
            type="password"
            autoComplete="new-password"
            required
            value={konfirmasi}
            onChange={(e) => setKonfirmasi(e.target.value)}
            disabled={sedangProses}
          />
        </div>
        <button
          type="submit"
          disabled={sedangProses || !lama || !baru || !konfirmasi}
          className={cn(buttonVariants(), "w-full sm:w-auto")}
        >
          {sedangProses ? "Memproses…" : "Perbarui kata sandi"}
        </button>
      </form>
    </section>
  );
}

export function KartuSesi() {
  const router = useRouter();
  const [sedangKeluar, setSedangKeluar] = useState(false);

  async function keluar() {
    setSedangKeluar(true);
    try {
      const supabase = await getSupabaseBrowser();
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-heading text-base font-semibold tracking-tight">Sesi</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Keluar dari perangkat ini. Data dasbor tetap tersimpan di server.
      </p>
      <button
        type="button"
        onClick={keluar}
        disabled={sedangKeluar}
        className={cn(buttonVariants({ variant: "outline" }), "mt-4 w-full sm:w-auto")}
      >
        <HugeiconsIcon icon={Logout03Icon} data-icon="inline-start" />
        {sedangKeluar ? "Memproses…" : "Keluar"}
      </button>
    </section>
  );
}
