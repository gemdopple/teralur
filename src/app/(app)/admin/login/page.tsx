import { redirect } from "next/navigation";

// Titik masuk admin lama: dialihkan ke halaman masuk terpadu (redesign v2).
// Halaman ada di dalam grup (app) yang memeriksa sesi, jadi render dinamis.
export const instant = false;

export default function AdminLoginPage() {
  redirect("/login");
}
