CREATE DATABASE IF NOT EXISTS db_rpl_kasir;
USE db_rpl_kasir;

-- Table: Users (Admin/Pemilik & Karyawan)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Will store hashed passwords
    nama VARCHAR(100) NOT NULL,
    role ENUM('admin', 'karyawan') NOT NULL DEFAULT 'karyawan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: Barang (Items)
CREATE TABLE IF NOT EXISTS barang (
    barang_id INT AUTO_INCREMENT PRIMARY KEY,
    nama_barang VARCHAR(100) NOT NULL,
    harga_beli DECIMAL(10, 2) NOT NULL,
    harga_jual DECIMAL(10, 2) NOT NULL,
    stok INT NOT NULL DEFAULT 0,
    stok_minimum INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: Transaksi (Sales Header)
CREATE TABLE IF NOT EXISTS transaksi (
    transaksi_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- Cashier who performed the sale
    total_harga DECIMAL(10, 2) NOT NULL,
    tanggal_transaksi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metode_pembayaran VARCHAR(50) DEFAULT 'Tunai',
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Table: Detail Transaksi (Sales Items)
CREATE TABLE IF NOT EXISTS detail_transaksi (
    detail_id INT AUTO_INCREMENT PRIMARY KEY,
    transaksi_id INT NOT NULL,
    barang_id INT NOT NULL,
    qty INT NOT NULL,
    harga_satuan DECIMAL(10, 2) NOT NULL, -- Price at the time of sale
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (transaksi_id) REFERENCES transaksi(transaksi_id),
    FOREIGN KEY (barang_id) REFERENCES barang(barang_id)
);

-- Table: Stok Log (History of In/Out)
CREATE TABLE IF NOT EXISTS stok_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    barang_id INT NOT NULL,
    user_id INT, -- Who made the change (optional)
    jenis ENUM('masuk', 'keluar', 'penyesuaian') NOT NULL,
    jumlah INT NOT NULL,
    keterangan TEXT,
    tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (barang_id) REFERENCES barang(barang_id)
);

-- Seed Data (Default Users)
-- Password 'admin123' (hash it in production, plain for now for simplicity if not using bcrypt yet)
INSERT INTO users (username, password, nama, role) VALUES 
('admin', 'admin123', 'Pemilik Warung', 'admin'),
('kasir', 'kasir123', 'Karyawan 1', 'karyawan');

-- Seed Data (Sample Items)
INSERT INTO barang (nama_barang, harga_beli, harga_jual, stok, stok_minimum) VALUES
('Beras 5kg', 60000, 65000, 20, 5),
('Minyak Goreng 1L', 14000, 16000, 50, 10),
('Gula Pasir 1kg', 12000, 13500, 30, 5),
('Indomie Goreng', 2500, 3000, 100, 20);
