import { LabelTiga } from "@/components/teralur/LabelTiga";

// TabelPapanCatatan (H.3): kolom Informasi · Papan · Catatan resmi · Label.
// Tiga field kunci selalu tampil; tujuh field lain hanya bila terisi di salah
// satu sisi. Sel null menampilkan "—". Pada selisih, sel field yang gagal
// bergaris jingga dan diberi teks "Berbeda" (bukan hanya warna). Di layar
// 360 px tabel berubah menjadi kartu bertumpuk tanpa gulir mendatar.

export type BarisPapanCatatan = {
  key: string;
  label: string;
  board: string | null;
  record: string | null;
  /** Sel field yang gagal compare (H.3): garis jingga + teks "Berbeda". */
  berbeda?: boolean;
};

export type SelisihProyek = {
  field: "packageName" | "supplier" | "contractValue";
  fieldLabel: string;
  boardValue: string;
  recordValue: string;
};

function SelNilai({
  nilai,
  sisi,
  berbeda,
  paksaKosong,
}: {
  nilai: string | null;
  sisi: "Papan" | "Catatan resmi";
  berbeda?: boolean;
  paksaKosong?: boolean;
}) {
  const kosong = paksaKosong || nilai === null;
  return (
    <div
      className={`min-w-0 rounded-md px-2 py-1.5${
        berbeda && !kosong ? " border-2 border-selisih bg-selisih/5" : ""
      }`}
    >
      <p className="text-xs text-neutral-500 sm:hidden">{sisi}</p>
      {kosong ? (
        <p className="text-sm text-neutral-500">—</p>
      ) : (
        <p className="break-words text-sm">{nilai}</p>
      )}
      {berbeda && !kosong ? (
        <p className="mt-1">
          <span className="inline-flex rounded border border-selisih bg-white px-1.5 py-0.5 text-[0.65rem] font-bold text-selisih">
            Berbeda
          </span>
        </p>
      ) : null}
    </div>
  );
}

export function TabelPapanCatatan({
  rows,
  selisih,
  tanpaCatatanResmi = false,
}: {
  rows: BarisPapanCatatan[];
  selisih: SelisihProyek[];
  /** H.2 not_found: kolom catatan resmi menampilkan "—". */
  tanpaCatatanResmi?: boolean;
}) {
  return (
    <section className="rounded-xl border-2 border-black bg-white p-4 sm:p-5" aria-label="Papan dan catatan resmi">
      <h2 className="font-heading text-xl font-bold">Papan dan catatan resmi</h2>

      {/* Kepala kolom hanya di layar lebar; di 360 px tiap baris jadi kartu. */}
      <div
        aria-hidden="true"
        className="mt-4 hidden gap-3 border-b border-neutral-200 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 sm:grid sm:grid-cols-[10rem_1fr_1fr_8rem]"
      >
        <p>Informasi</p>
        <p>Papan</p>
        <p>Catatan resmi</p>
        <p className="text-right">Label</p>
      </div>

      <div className="divide-y divide-neutral-200">
        {rows.map((row) => {
          const adaIsi = row.board !== null || row.record !== null;
          return (
            <div
              key={row.key}
              className="grid gap-2 py-3 sm:grid-cols-[10rem_1fr_1fr_8rem] sm:items-start sm:gap-3"
            >
              <div className="sm:pt-1">
                <p className="font-semibold">{row.label}</p>
                <p className="sm:hidden">
                  <LabelTiga label={adaIsi ? "tercatat" : "belum_diketahui"} />
                </p>
              </div>
              <SelNilai nilai={row.board} sisi="Papan" berbeda={row.berbeda} />
              <SelNilai
                nilai={row.record}
                sisi="Catatan resmi"
                berbeda={row.berbeda}
                paksaKosong={tanpaCatatanResmi}
              />
              <div className="hidden text-right sm:block">
                <LabelTiga label={adaIsi ? "tercatat" : "belum_diketahui"} />
              </div>
            </div>
          );
        })}
      </div>

      {selisih.length > 0 ? (
        <div className="mt-4 rounded-md border-l-4 border-selisih bg-selisih/5 p-3">
          {selisih.map((item) => (
            <div key={item.field} className="mt-1 first:mt-0">
              <p className="text-sm font-semibold">{item.fieldLabel} berbeda:</p>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-neutral-500">Papan</p>
                  <p className="break-words text-sm font-medium">{item.boardValue}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Catatan resmi</p>
                  <p className="break-words text-sm font-medium">{item.recordValue}</p>
                </div>
              </div>
            </div>
          ))}
          <p className="mt-3 text-sm text-neutral-700">
            Perbedaan sering wajar, misalnya karena addendum atau perubahan kontrak.
          </p>
        </div>
      ) : null}
    </section>
  );
}
