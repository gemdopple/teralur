create or replace function consume_rate_limit(
  p_ip_hash text,
  p_window timestamptz,
  p_limit integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer;
begin
  insert into pembatasan (ip_hash, jendela, jumlah)
  values (p_ip_hash, p_window, 1)
  on conflict (ip_hash, jendela)
  do update set jumlah = pembatasan.jumlah + 1
  returning jumlah into next_count;

  return next_count <= p_limit;
end;
$$;

revoke all on function consume_rate_limit(text, timestamptz, integer) from public;
grant execute on function consume_rate_limit(text, timestamptz, integer) to service_role;

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
  snapshot_tanggal date
)
language sql
stable
set search_path = public
as $$
  select r.id, r.id_sumber, r.sumber, r.nama_paket, r.penyedia, r.nilai_kontrak,
         r.tanggal_kontrak, r.masa_hari, r.tahun, r.satuan_kerja, r.snapshot_tanggal
  from records r
  where (filter_year is null or r.tahun = filter_year)
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
set search_path = public
as $$
  select r.id, r.id_sumber, r.sumber, r.nama_paket, r.penyedia, r.nilai_kontrak,
         r.tanggal_kontrak, r.masa_hari, r.tahun, r.satuan_kerja, r.snapshot_tanggal
  from records r
  where (year_filter is null or r.tahun = year_filter)
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

create or replace function visit_report_counts(p_project_key text)
returns table (keadaan text, jumlah bigint)
language sql
stable
set search_path = public
as $$
  select v.keadaan, count(*)::bigint
  from kunjungan v
  where v.kunci_proyek = p_project_key
  group by v.keadaan;
$$;

revoke all on function visit_report_counts(text) from public;
grant execute on function visit_report_counts(text) to service_role;
