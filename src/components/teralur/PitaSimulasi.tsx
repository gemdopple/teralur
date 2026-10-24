// PitaSimulasi (PRD 8.3 / F-12): pita lebar penuh, latar --hitam-aspal, teks
// --kuning-papan. Bentuknya berbeda dari lencana TERCATAT (pita penuh vs
// lencana kecil) supaya tidak tertukar. Menempel di atas halaman (H.1).
// Teks persis teks baku 8.4 "Pita simulasi".

const TEKS_SIMULASI =
  "SIMULASI, BUKAN DATA RESMI. Data di halaman ini dibuat tim untuk lomba.";

export function PitaSimulasi() {
  return (
    <div className="sticky top-0 z-40 bg-hitam-aspal px-4 py-2.5">
      <p className="mx-auto w-full max-w-[60rem] text-center text-xs font-bold uppercase leading-5 tracking-wide text-kuning-papan sm:text-sm">
        {TEKS_SIMULASI}
      </p>
    </div>
  );
}

// Pita data untuk proyek non-demo (H.1: "PitaSimulasi atau pita data"):
// teks baku v1.0 "Data resmi per {tanggal}. Bukan data real-time."
export function PitaData({ tanggal }: { tanggal: string }) {
  return (
    <div className="sticky top-0 z-40 border-b-2 border-black bg-kuning-papan px-4 py-2.5">
      <p className="mx-auto w-full max-w-[60rem] text-center text-xs font-bold uppercase leading-5 tracking-wide text-hitam-aspal sm:text-sm">
        Data resmi per {tanggal}. Bukan data real-time.
      </p>
    </div>
  );
}
