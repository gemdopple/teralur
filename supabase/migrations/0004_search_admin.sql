-- 0004_search_admin.sql — PRD v1.1 Lampiran E.12
-- search_records: proyek admin draf/dinonaktifkan tidak pernah muncul;
-- setiap baris membawa slug proyek admin terbit (nullable) + demo.
-- find_record_candidates: data simulasi (sumber='simulasi') tidak pernah menjadi
-- kandidat jalur foto beku. Tanda tangan argumen tidak berubah (kompatibel
-- src/lib/server-api.ts); kolom balikan search_records bertambah demo + slug.
-- Idempoten: create or replace function. search_records ganti tipe balikan
-- (demo + slug), jadi harus drop dulu — aman karena tidak ada objek lain
-- yang bergantung padanya (dipanggil service role lewat RPC PostgREST).
drop function if exists search_records(text, integer, integer);

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
    -- proyek admin draf/dinonaktifkan tidak boleh muncul sama sekali;
    -- catatan simulasi tanpa proyek terbit juga tidak boleh bocor.
    and (s.id is null or (s.terbit and not s.dinonaktifkan))
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

create or replace function find_record_candidates(
  package_name text,
  supplier_name text,
  year_filter integer default null
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
  snapshot_tanggal date
)
language sql
stable
set search_path = public, extensions
as $$
  select r.id, r.id_sumber, r.sumber, r.nama_paket, r.penyedia, r.nilai_kontrak,
         r.tanggal_kontrak, r.masa_hari, r.tahun, r.satuan_kerja, r.snapshot_tanggal
  from records r
  where (year_filter is null or r.tahun = year_filter)
    -- data simulasi tidak pernah menjadi kandidat jalur foto beku
    and coalesce(r.sumber, '') <> 'simulasi'
    and (
      (package_name <> '' and r.nama_norm % package_name)
      or (supplier_name <> '' and coalesce(r.penyedia_norm, '') % supplier_name)
    )
  order by greatest(
    case when package_name = '' then 0 else similarity(r.nama_norm, package_name) end,
    case when supplier_name = '' then 0 else similarity(coalesce(r.penyedia_norm, ''), supplier_name) end
  ) desc
  limit 100;
$$;

revoke all on function search_records(text, integer, integer) from public;
revoke all on function find_record_candidates(text, text, integer) from public;
grant execute on function search_records(text, integer, integer) to service_role;
grant execute on function find_record_candidates(text, text, integer) to service_role;
