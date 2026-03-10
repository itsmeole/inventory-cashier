-- 1. PASTIKAN DATA MASTER BARANG DAN USER TERSEDIA
-- Jika belum ada barang, silakan uncomment dan jalankan ini.
-- INSERT INTO public.barang (barang_id, nama_barang, harga_beli, harga_jual, stok, stok_minimum, satuan) 
-- VALUES 
-- (1, 'Kopi Seduh', 3000, 5000, 100, 10, 'Gelas'),
-- (2, 'Indomie Telur', 8000, 12000, 100, 10, 'Porsi');

-- Jika belum ada user, silakan uncomment dan jalankan ini.
-- INSERT INTO public.users (user_id, nama, username, password, role) 
-- VALUES
-- (1, 'Admin Utama', 'admin', 'admin123', 'admin'),
-- (2, 'Kasir 1', 'kasir', 'kasir123', 'kasir');

-- PERHATIKAN: Script ini menggunakan transaksi_id dari 10000 agar tidak menimpa ID yang sudah ada

-- 2. TRANSAKSI 3 BULAN LALU (Bulan -3, kira-kira 80-90 hari lalu)
INSERT INTO public.transaksi (transaksi_id, user_id, total_harga, bayar, kembalian, metode_pembayaran, tanggal_transaksi) VALUES
(10001, 2, 17000, 20000, 3000, 'Tunai', CURRENT_DATE - INTERVAL '85 days'),
(10002, 1, 10000, 10000, 0, 'Tunai', CURRENT_DATE - INTERVAL '80 days'),
(10003, 2, 24000, 50000, 26000, 'Tunai', CURRENT_DATE - INTERVAL '75 days');

INSERT INTO public.detail_transaksi (transaksi_id, barang_id, nama_barang, harga_beli, qty, harga_satuan, subtotal) VALUES
(10001, 1, 'Kopi Seduh', 3000, 1, 5000, 5000),
(10001, 2, 'Indomie Telur', 8000, 1, 12000, 12000),
(10002, 1, 'Kopi Seduh', 3000, 2, 5000, 10000),
(10003, 2, 'Indomie Telur', 8000, 2, 12000, 24000);

-- 3. TRANSAKSI 2 BULAN LALU (Bulan -2, kira-kira 50-60 hari lalu)
INSERT INTO public.transaksi (transaksi_id, user_id, total_harga, bayar, kembalian, metode_pembayaran, tanggal_transaksi) VALUES
(10004, 2, 12000, 15000, 3000, 'Tunai', CURRENT_DATE - INTERVAL '55 days'),
(10005, 2, 34000, 40000, 6000, 'Tunai', CURRENT_DATE - INTERVAL '50 days');

INSERT INTO public.detail_transaksi (transaksi_id, barang_id, nama_barang, harga_beli, qty, harga_satuan, subtotal) VALUES
(10004, 2, 'Indomie Telur', 8000, 1, 12000, 12000),
(10005, 1, 'Kopi Seduh', 3000, 2, 5000, 10000),
(10005, 2, 'Indomie Telur', 8000, 2, 12000, 24000);

-- 4. TRANSAKSI BULAN LALU (Bulan -1, kira-kira 20-30 hari lalu)
INSERT INTO public.transaksi (transaksi_id, user_id, total_harga, bayar, kembalian, metode_pembayaran, tanggal_transaksi) VALUES
(10006, 1, 22000, 25000, 3000, 'Tunai', CURRENT_DATE - INTERVAL '25 days'),
(10007, 2, 5000, 5000, 0, 'Tunai', CURRENT_DATE - INTERVAL '20 days');

INSERT INTO public.detail_transaksi (transaksi_id, barang_id, nama_barang, harga_beli, qty, harga_satuan, subtotal) VALUES
(10006, 1, 'Kopi Seduh', 3000, 2, 5000, 10000),
(10006, 2, 'Indomie Telur', 8000, 1, 12000, 12000),
(10007, 1, 'Kopi Seduh', 3000, 1, 5000, 5000);

-- 5. TRANSAKSI 2 MINGGU TERAKHIR
INSERT INTO public.transaksi (transaksi_id, user_id, total_harga, bayar, kembalian, metode_pembayaran, tanggal_transaksi) VALUES
(10008, 2, 29000, 30000, 1000, 'Tunai', CURRENT_DATE - INTERVAL '14 days'),
(10009, 2, 36000, 50000, 14000, 'Tunai', CURRENT_DATE - INTERVAL '7 days');

INSERT INTO public.detail_transaksi (transaksi_id, barang_id, nama_barang, harga_beli, qty, harga_satuan, subtotal) VALUES
(10008, 1, 'Kopi Seduh', 3000, 1, 5000, 5000),
(10008, 2, 'Indomie Telur', 8000, 2, 12000, 24000),
(10009, 2, 'Indomie Telur', 8000, 3, 12000, 36000);

-- 6. TRANSAKSI HARI INI
INSERT INTO public.transaksi (transaksi_id, user_id, total_harga, bayar, kembalian, metode_pembayaran, tanggal_transaksi) VALUES
(10010, 2, 17000, 20000, 3000, 'Tunai', CURRENT_DATE),
(10011, 1, 12000, 12000, 0, 'Tunai', CURRENT_DATE);

INSERT INTO public.detail_transaksi (transaksi_id, barang_id, nama_barang, harga_beli, qty, harga_satuan, subtotal) VALUES
(10010, 1, 'Kopi Seduh', 3000, 1, 5000, 5000),
(10010, 2, 'Indomie Telur', 8000, 1, 12000, 12000),
(10011, 2, 'Indomie Telur', 8000, 1, 12000, 12000);

-- 7. RE-SYNC SEQUENCE (Penting agar insert aplikasi tidak error karena primary key bentrok)
SELECT setval('transaksi_transaksi_id_seq', (SELECT MAX(transaksi_id) FROM public.transaksi));
SELECT setval('detail_transaksi_detail_id_seq', (SELECT MAX(detail_id) FROM public.detail_transaksi));
