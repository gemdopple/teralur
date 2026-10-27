-- 0005_contractors.sql — akun kontraktor & penugasan proyek
-- Peran dasbor berpindah dari cookie (mode sudut pandang demo) ke data akun:
-- tabel `profiles` mengikat auth.users -> peran, dan `submissions.contractor_id`
-- mengikat satu proyek ke tepat satu kontraktor.
-- Additive dan idempoten; aman dijalankan ulang.

-- kontraktor: entitas pelaksana yang ditugasi proyek oleh pemerintah.
-- user_id menghubungkan akun login (auth.users) ke kontraktor ini; boleh kosong
-- (kontraktor tercatat tanpa akun) dan di-null-kan bila akun dihapus.
create table if not exists contractors (
  id uuid primary key default gen_random_uuid(),
  nama text not null check (char_length(nama) between 1 and 200),
  kontak text,
  user_id uuid unique references auth.users(id) on delete set null,
  nonaktif boolean not null default false,
  dibuat timestamptz not null default now()
);
create index if not exists contractors_user_idx on contractors (user_id);

-- profiles: peran server-side per akun (pengganti cookie peran).
-- role menentukan sudut pandang dan hak akses; contractor_id hanya terisi untuk
-- peran 'kontraktor' dan menjadi kunci penyaringan proyek miliknya.
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('pemerintah', 'kontraktor', 'admin')),
  contractor_id uuid references contractors(id) on delete set null,
  dibuat timestamptz not null default now(),
  diperbarui timestamptz not null default now()
);
create index if not exists profiles_contractor_idx on profiles (contractor_id);

-- submissions: penugasan ke satu kontraktor (di samping penyedia pada records).
-- on delete set null: menghapus kontraktor tidak menghapus proyeknya.
alter table submissions
  add column if not exists contractor_id uuid references contractors(id) on delete set null;
create index if not exists submissions_contractor_idx
  on submissions (contractor_id) where contractor_id is not null;

alter table contractors enable row level security;
alter table profiles enable row level security;
-- sengaja tanpa policy: hanya service role yang mengakses (konsisten dengan 0001)

-- perbarui kolom diperbarui otomatis pada update profiles
create or replace function set_profiles_diperbarui() returns trigger as $$
begin
  new.diperbarui = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_diperbarui on profiles;
create trigger profiles_set_diperbarui
  before update on profiles
  for each row execute function set_profiles_diperbarui();