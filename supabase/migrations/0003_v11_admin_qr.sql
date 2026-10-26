-- 0003_v11_admin_qr.sql — PRD v1.1 Lampiran C.1/C.2
-- Kolom admin, tabel resources, bucket Storage. Additive dan idempoten; aman dijalankan ulang.
-- Disesuaikan dengan 0001_init.sql: submissions.jenis punya check inline
-- (nama otomatis submissions_jenis_check), RLS aktif tanpa policy di semua tabel.

-- records: tandai data simulasi
alter table records
  add column if not exists demo boolean not null default false;

-- submissions: dukung proyek buatan admin
alter table submissions
  add column if not exists terbit boolean not null default true,
  add column if not exists unggulan boolean not null default false,
  add column if not exists dinonaktifkan boolean not null default false,
  add column if not exists diperbarui timestamptz not null default now();

-- izinkan jenis 'admin' (drop + re-add agar nilai lama tetap valid)
alter table submissions drop constraint if exists submissions_jenis_check;

do $$
begin
  alter table submissions
    add constraint submissions_jenis_check check (jenis in ('foto', 'cari', 'admin'));
exception
  when duplicate_object then null;
end $$;

-- indeks bantu daftar publik
create index if not exists submissions_publik_idx
  on submissions (jenis, terbit, dinonaktifkan);

-- resource unggahan admin (F-16)
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  jenis text not null check (jenis in ('photo', 'document')),
  judul text not null check (char_length(judul) between 1 and 120),
  path_penyimpanan text not null unique,
  ukuran int not null check (ukuran > 0 and ukuran <= 4194304),
  tipe_mime text not null
    check (tipe_mime in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  dibuat timestamptz not null default now()
);
create index if not exists resources_submission_idx
  on resources (submission_id, dibuat);

alter table resources enable row level security;
-- sengaja tanpa policy: hanya service role yang mengakses (konsisten dengan 0001)

-- perbarui kolom diperbarui otomatis pada update submissions
create or replace function set_diperbarui() returns trigger as $$
begin
  new.diperbarui = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists submissions_set_diperbarui on submissions;
create trigger submissions_set_diperbarui
  before update on submissions
  for each row execute function set_diperbarui();

-- bucket Storage `resources` (C.2): baca publik (nama objek acak), batas 4 MB,
-- mime terbatas. Tulis/hapus hanya lewat service role dari server.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resources',
  'resources',
  true,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
