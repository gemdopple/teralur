// Date helpers per PRD Lampiran D.3. All pure — no Date.now() inside library
// functions; jakartaToday takes an instant as an optional argument.

// Tanggal kalender hari ini di WIB (Asia/Jakarta), format TTTT-BB-HH (C-09).
// en-CA memberi format YYYY-MM-DD secara bawaan.
export function jakartaToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(now);
}

// Selisih hari kalender antara dua tanggal ISO TTTT-BB-HH (to − from).
// Tanggal diperlakukan sebagai tengah malam UTC agar hitungan stabil antarzona.
export function daysBetween(fromIso: string, toIso: string): number {
  const ms = Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

// Tanggal ISO TTTT-BB-HH ditambah n hari kalender.
export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Tanggal-saja diformat di UTC (id-ID, bulan panjang) agar tidak bergeser sehari.
export function formatTanggal(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}
