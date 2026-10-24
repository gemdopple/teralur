"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

// Lampiran I.3 / L.1: formulir email + kata sandi memanggil
// supabase.auth.signInWithPassword dari klien. Pesan galat tunggal, tanpa
// tautan daftar atau lupa kata sandi (reset lewat dashboard Supabase).

const PESAN_GALAT = "Email atau kata sandi salah.";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [sedangMasuk, setSedangMasuk] = useState(false);
  const [galat, setGalat] = useState(false);

  // Nyaman: bila sesi sudah ada, langsung ke /admin. Pemeriksaan tidak
  // memblokir formulir — bila gagal atau lambat, Masuk tetap bisa dipakai.
  useEffect(() => {
    let aktif = true;
    getSupabaseBrowser()
      .auth.getUser()
      .then(({ data }) => {
        if (aktif && data.user) router.replace("/admin");
      })
      .catch(() => {});
    return () => {
      aktif = false;
    };
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSedangMasuk(true);
    setGalat(false);
    const { error } = await getSupabaseBrowser().auth.signInWithPassword({
      email,
      password: kataSandi,
    });
    if (error) {
      setGalat(true);
      setSedangMasuk(false);
      return;
    }
    // Layout (dashboard) memverifikasi ulang sesi + allowlist di server.
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <h1 className="text-center font-heading text-3xl font-extrabold tracking-tight">
        teralur
      </h1>
      <p className="mt-1 text-center text-sm font-semibold uppercase tracking-widest text-neutral-600">
        Admin
      </p>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Masuk</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {galat ? (
              <p
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
              >
                {PESAN_GALAT}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={sedangMasuk}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kata-sandi">Kata sandi</Label>
              <Input
                id="kata-sandi"
                name="kataSandi"
                type="password"
                autoComplete="current-password"
                required
                value={kataSandi}
                onChange={(e) => setKataSandi(e.target.value)}
                disabled={sedangMasuk}
              />
            </div>
            <Button type="submit" className="w-full" disabled={sedangMasuk}>
              {sedangMasuk ? "Memproses…" : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
