// T-16 / F-10: ukur latensi /api/search dengan 5 kata kunci nyata.
// Pakai: npx tsx --env-file=.env scripts/measure-search-latency.ts [baseUrl]
// Hasil mencakup p95 dari 5 permintaan; target PRD F-10: ≤ 2 detik per pencarian.

const QUERIES = [
  { q: "jalan", year: null },
  { q: "drainase", year: null },
  { q: "gedung sekolah", year: null },
  { q: "rehabilitasi jalan", year: 2023 },
  { q: "pembangunan pasar", year: null },
];

function p95(durations: number[]): number {
  const sorted = [...durations].sort((a, b) => a - b);
  // Nearest-rank p95 for a small sample: ceil(0.95 * n)-th value.
  const idx = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

async function main(): Promise<void> {
  const baseUrl = process.argv[2] ?? "http://localhost:3000";
  const durations: number[] = [];
  for (const { q, year } of QUERIES) {
    const url = new URL("/api/search", baseUrl);
    url.searchParams.set("q", q);
    if (year !== null) url.searchParams.set("year", String(year));
    const mulai = performance.now();
    const res = await fetch(url);
    const body = (await res.json()) as { results?: unknown[] };
    const ms = performance.now() - mulai;
    durations.push(ms);
    if (!res.ok) throw new Error(`HTTP ${res.status} untuk ${q}`);
    console.log(`q="${q}"${year ? ` year=${year}` : ""} → ${body.results?.length ?? 0} hasil, ${ms.toFixed(0)} ms`);
  }
  console.log(`p95 (5 permintaan): ${p95(durations).toFixed(0)} ms — target F-10 ≤ 2000 ms`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
