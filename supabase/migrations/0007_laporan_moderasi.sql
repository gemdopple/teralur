-- Moderasi laporan warga (anti-massa): tim bisa menyembunyikan laporan yang
-- terindikasi spam tanpa menghapus jejak audit. Hitungan publik (RPC
-- visit_report_counts) hanya menghitung baris yang tampil.

alter table kunjungan add column if not exists tampil boolean not null default true;

create or replace function visit_report_counts(p_project_key text)
returns table (keadaan text, jumlah bigint)
language sql
stable
set search_path = public, extensions
as $$
  select v.keadaan, count(*)::bigint
  from kunjungan v
  where v.kunci_proyek = p_project_key
    and v.tampil
  group by v.keadaan;
$$;

revoke all on function visit_report_counts(text) from public;
grant execute on function visit_report_counts(text) to service_role;
