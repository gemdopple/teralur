// TabelPapanCatatan (H.3): kolom Informasi · Papan · Catatan resmi — gaya kartu
// modern yang ringkas: baris text-sm dengan py-2.5, kepala kolom kecil biasa,
// kartu rounded-2xl dengan bayangan lembut. Tiga field kunci selalu tampil;
// tujuh field lain hanya bila terisi di salah satu sisi. Sel null menampilkan
// "—". Pada selisih, sel field yang gagal diberi tint selisih rounded-md dan
// teks "Berbeda". Di layar 360 px tabel berubah menjadi kartu bertumpuk tanpa
// gulir mendatar.

export type BarisPapanCatatan = {
  key: string;
  label: string;
  board: string | null;
  record: string | null;
  /** Sel field yang gagal compare (H.3): tint selisih + teks "Berbeda". */
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
        berbeda && !kosong ? " bg-selisih/10" : ""
      }`}
    >
      <p className="text-xs text-muted-foreground sm:hidden">{sisi}</p>
      {kosong ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <p className="break-words text-sm">{nilai}</p>
      )}
      {berbeda && !kosong ? (
        <p className="mt-1">
          <span className="inline-flex rounded-md bg-selisih/15 px-2 py-0.5 text-[0.65rem] font-bold text-selisih">
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
    <section
      className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
      aria-label="Papan dan catatan resmi"
    >
      <h2 className="font-heading text-lg font-semibold tracking-tight">
        Papan dan catatan resmi
      </h2>

      {/* Kepala kolom hanya di layar lebar; di 360 px tiap baris jadi kartu. */}
      <div
        aria-hidden="true"
        className="mt-3 hidden gap-3 border-b border-border pb-2 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[10rem_1fr_1fr]"
      >
        <p>Informasi</p>
        <p>Papan</p>
        <p>Catatan resmi</p>
      </div>

      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid gap-2 py-2.5 sm:grid-cols-[10rem_1fr_1fr] sm:items-start sm:gap-3"
          >
            <p className="pt-1.5 text-sm font-semibold">{row.label}</p>
            <SelNilai nilai={row.board} sisi="Papan" berbeda={row.berbeda} />
            <SelNilai
              nilai={row.record}
              sisi="Catatan resmi"
              berbeda={row.berbeda}
              paksaKosong={tanpaCatatanResmi}
            />
          </div>
        ))}
      </div>

      {selisih.length > 0 ? (
        <div className="mt-4 rounded-xl border border-selisih/30 bg-selisih/5 p-4">
          {selisih.map((item) => (
            <div key={item.field} className="mt-1 first:mt-0">
              <p className="text-sm font-semibold">{item.fieldLabel} berbeda:</p>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Papan</p>
                  <p className="break-words text-sm font-medium">{item.boardValue}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Catatan resmi</p>
                  <p className="break-words text-sm font-medium">{item.recordValue}</p>
                </div>
              </div>
            </div>
          ))}
          <p className="mt-3 text-sm text-muted-foreground">
            Perbedaan sering wajar, misalnya karena addendum atau perubahan kontrak.
          </p>
        </div>
      ) : null}
    </section>
  );
}
