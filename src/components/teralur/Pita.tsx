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
