-- 0006_hapus_terbit.sql
-- Fitur draf/terbit dihapus: proyek yang tersimpan di `submissions` langsung
-- tampil publik, satu-satunya gerbang visibilitas yang tersisa adalah
-- `dinonaktifkan` (hapus lunak). Migrasi ini juga menambah `profiles.nama`
-- agar akun pemerintah punya label di layar pengelolaan akun.
--
-- PERHATIAN: `drop column terbit` tidak bisa dibatalkan. Proyek yang saat ini
-- tersimpan dengan terbit = false (draf) akan langsung terlihat publik.
-- Satu-satunya jalan menahannya: nonaktifkan dulu proyek tersebut.

-- 1. Gerbang publik search_records: cukup dinonaktifkan.
--    Catatan simulasi tanpa proyek admin tetap tidak boleh bocor.
create or replace function search_records(
  search_text text,
  filter_year integer default null,
  result_limit integer default 10
) returns table (
  id uuid,
  id_sumber text,
  sumber text,
  nama_paket text,
  penyedia text,
  nilai_kontrak bigint,
  tanggal_kontrak date,
  masa_hari integer,
  tahun integer,
  satuan_kerja text,
  snapshot_tanggal date,
  demo boolean,
  slug text
)
language sql
stable
set search_path = public, extensions
as $$
  select r.id, r.id_sumber, r.sumber, r.nama_paket, r.penyedia, r.nilai_kontrak,
         r.tanggal_kontrak, r.masa_hari, r.tahun, r.satuan_kerja, r.snapshot_tanggal,
         r.demo, s.slug
  from records r
  left join submissions s
    on s.record_id = r.id and s.jenis = 'admin'
  where (filter_year is null or r.tahun = filter_year)
    and (s.id is null or not s.dinonaktifkan)
    and (coalesce(r.sumber, '') <> 'simulasi' or s.id is not null)
    and (
      r.nama_norm % search_text
      or coalesce(r.penyedia_norm, '') % search_text
    )
  order by greatest(
    similarity(r.nama_norm, search_text),
    similarity(coalesce(r.penyedia_norm, ''), search_text)
  ) desc
  limit greatest(1, least(result_limit, 10));
$$;

revoke all on function search_records(text, integer, integer) from public;
grant execute on function search_records(text, integer, integer) to service_role;

-- 2. Indeks daftar publik: `terbit` dibuang dari kunci.
drop index if exists submissions_publik_idx;
create index if not exists submissions_publik_idx
  on submissions (jenis, dinonaktifkan);

-- 3. Kolom terbit dihapus.
alter table submissions drop column if exists terbit;

-- 4. Label akun pemerintah (kontraktor memakai contractors.nama).
alter table profiles add column if not exists nama text
  check (nama is null or char_length(nama) between 1 and 200);