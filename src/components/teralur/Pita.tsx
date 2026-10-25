// PitaSimulasi (PRD 8.3 / F-12): pita lebar penuh untuk data simulasi —
// teks persis teks baku 8.4 "Pita simulasi". Wajib pada halaman apa pun yang
// menampilkan proyek demo, menggantikan pita data.
const TEKS_SIMULASI =
  "SIMULASI, BUKAN DATA RESMI. Data di halaman ini dibuat tim untuk lomba.";

export function PitaSimulasi() {
  return (
    <div className="sticky top-0 z-40 bg-hitam-aspal px-4 py-2.5">
      <p className="mx-auto w-full max-w-6xl text-center text-xs font-bold uppercase leading-5 tracking-wide text-kuning-papan sm:text-sm">
        {TEKS_SIMULASI}
      </p>
    </div>
  );
}

// Pita tanggal data (H.1): teks baku v1.0 "Data resmi per {tanggal}. Bukan
// data real-time." — menempel di atas halaman data.
export function PitaData({ tanggal }: { tanggal: string }) {
  return (
    <div className="border-b border-hitam-aspal/20 bg-kuning-papan px-4 py-2.5">
      <p className="mx-auto w-full max-w-6xl text-center text-xs font-bold uppercase leading-5 tracking-wide text-hitam-aspal sm:text-sm">
        Data resmi per {tanggal}. Bukan data real-time.
      </p>
    </div>
  );
}
