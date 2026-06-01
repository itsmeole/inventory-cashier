-- ============================================================
-- SCHEMA BARU DENGAN UUID
-- Jalankan di Supabase SQL Editor
-- PERHATIAN: Pastikan tabel lama sudah di-DROP terlebih dahulu
-- ============================================================

-- Langkah 1: Drop semua tabel lama (urutan penting karena foreign key)
DROP TABLE IF EXISTS public.stok_log CASCADE;
DROP TABLE IF EXISTS public.detail_transaksi CASCADE;
DROP TABLE IF EXISTS public.transaksi CASCADE;
DROP TABLE IF EXISTS public.barang CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;

-- Langkah 2: Buat tabel baru dengan UUID
-- gen_random_uuid() sudah tersedia di Supabase (PostgreSQL 13+)

CREATE TABLE public.stores (
  store_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nama_toko character varying DEFAULT 'WARDIG - Warung Digital',
  jalan character varying DEFAULT '',
  rt_rw character varying DEFAULT '',
  kecamatan character varying DEFAULT '',
  kabupaten character varying DEFAULT '',
  provinsi character varying DEFAULT '',
  CONSTRAINT stores_pkey PRIMARY KEY (store_id)
);

CREATE TABLE public.users (
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nama character varying NOT NULL,
  username character varying NOT NULL UNIQUE,
  password character varying NOT NULL,
  role character varying NOT NULL DEFAULT 'kasir' CHECK (role = ANY (ARRAY['admin'::character varying, 'kasir'::character varying])),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  store_id uuid,
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT fk_user_store FOREIGN KEY (store_id) REFERENCES public.stores(store_id)
);

CREATE TABLE public.barang (
  barang_id uuid NOT NULL DEFAULT gen_random_uuid(),
  nama_barang character varying NOT NULL,
  harga_beli numeric NOT NULL,
  harga_jual numeric NOT NULL,
  stok numeric NOT NULL DEFAULT 0,
  stok_minimum numeric NOT NULL DEFAULT 5,
  satuan character varying DEFAULT 'Pcs',
  gambar character varying,
  is_deleted integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  store_id uuid,
  CONSTRAINT barang_pkey PRIMARY KEY (barang_id),
  CONSTRAINT fk_barang_store FOREIGN KEY (store_id) REFERENCES public.stores(store_id)
);

CREATE TABLE public.transaksi (
  transaksi_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  total_harga numeric NOT NULL,
  bayar numeric,
  kembalian numeric,
  metode_pembayaran character varying DEFAULT 'cash',
  tanggal_transaksi timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  store_id uuid,
  CONSTRAINT transaksi_pkey PRIMARY KEY (transaksi_id),
  CONSTRAINT fk_trans_store FOREIGN KEY (store_id) REFERENCES public.stores(store_id),
  CONSTRAINT transaksi_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);

CREATE TABLE public.detail_transaksi (
  detail_id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaksi_id uuid NOT NULL,
  barang_id uuid,
  nama_barang character varying,
  harga_beli numeric,
  qty numeric NOT NULL,
  harga_satuan numeric NOT NULL,
  subtotal numeric NOT NULL,
  CONSTRAINT detail_transaksi_pkey PRIMARY KEY (detail_id),
  CONSTRAINT detail_transaksi_transaksi_id_fkey FOREIGN KEY (transaksi_id) REFERENCES public.transaksi(transaksi_id),
  CONSTRAINT detail_transaksi_barang_id_fkey FOREIGN KEY (barang_id) REFERENCES public.barang(barang_id)
);

CREATE TABLE public.stok_log (
  log_id uuid NOT NULL DEFAULT gen_random_uuid(),
  barang_id uuid,
  user_id uuid,
  nama_barang character varying,
  jenis character varying NOT NULL CHECK (jenis = ANY (ARRAY['masuk'::character varying, 'keluar'::character varying, 'penyesuaian'::character varying])),
  jumlah numeric NOT NULL,
  keterangan text,
  tanggal timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  store_id uuid,
  CONSTRAINT stok_log_pkey PRIMARY KEY (log_id),
  CONSTRAINT fk_log_store FOREIGN KEY (store_id) REFERENCES public.stores(store_id),
  CONSTRAINT stok_log_barang_id_fkey FOREIGN KEY (barang_id) REFERENCES public.barang(barang_id),
  CONSTRAINT stok_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
