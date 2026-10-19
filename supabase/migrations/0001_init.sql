create extension if not exists pg_trgm;

create table records (
  id uuid primary key default gen_random_uuid(),
  sumber text not null,
  id_sumber text not null,
  nama_paket text not null,
  nama_norm text not null,
  satuan_kerja text,
  penyedia text,
  penyedia_norm text,
  nilai_kontrak bigint not null,
  tanggal_kontrak date,
  masa_hari int,
  tahun int,
  wilayah text,
  metode text,
  mentah jsonb,
  snapshot_tanggal date not null,
  unique (sumber, id_sumber)
);
create index records_nama_trgm on records using gin (nama_norm gin_trgm_ops);
create index records_penyedia_trgm on records using gin (penyedia_norm gin_trgm_ops);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  jenis text not null check (jenis in ('foto','cari')),
  papan jsonb,
  record_id uuid references records(id),
  status text,
  skor numeric,
  kandidat jsonb,
  dibuat timestamptz default now(),
  demo boolean default false
);

create table kunjungan (
  id uuid primary key default gen_random_uuid(),
  kunci_proyek text not null,
  keadaan text not null check (keadaan in ('aktivitas','tidak_terlihat','selesai')),
  catatan text,
  perangkat_hash text not null,
  tanggal date not null default current_date,
  unique (kunci_proyek, perangkat_hash, tanggal)
);

create table pembatasan (
  ip_hash text not null,
  jendela timestamptz not null,
  jumlah int not null default 1,
  primary key (ip_hash, jendela)
);

alter table records enable row level security;
alter table submissions enable row level security;
alter table kunjungan enable row level security;
alter table pembatasan enable row level security;
