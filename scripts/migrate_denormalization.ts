import pool from '@/lib/db';

async function migrate() {
    console.log('Starting Migration...');

    try {
        const connection = await pool.getConnection();

        // 1. ALTER detail_transaksi
        console.log('Altering detail_transaksi...');
        await connection.query(`
            ALTER TABLE detail_transaksi 
            ADD COLUMN nama_barang VARCHAR(100) NULL AFTER barang_id,
            ADD COLUMN harga_beli DECIMAL(10, 2) NULL AFTER nama_barang,
            MODIFY COLUMN barang_id INT NULL;
        `);

        // Update FK to ON DELETE SET NULL
        try {
            await connection.query(`ALTER TABLE detail_transaksi DROP FOREIGN KEY detail_transaksi_ibfk_2;`);
        } catch (e) {
            console.log('FK detail_transaksi_ibfk_2 might not exist or verify name via SHOW CREATE TABLE. Proceeding...');
        }
        await connection.query(`
            ALTER TABLE detail_transaksi 
            ADD CONSTRAINT fk_detail_barang 
            FOREIGN KEY (barang_id) REFERENCES barang(barang_id) ON DELETE SET NULL;
        `);

        // 2. ALTER stok_log
        console.log('Altering stok_log...');
        await connection.query(`
            ALTER TABLE stok_log 
            ADD COLUMN nama_barang VARCHAR(100) NULL AFTER barang_id,
            MODIFY COLUMN barang_id INT NULL;
        `);

        // Update FK to ON DELETE SET NULL
        try {
            await connection.query(`ALTER TABLE stok_log DROP FOREIGN KEY stok_log_ibfk_1;`);
        } catch (e) {
            console.log('FK stok_log_ibfk_1 might not exist. Proceeding...');
        }
        await connection.query(`
            ALTER TABLE stok_log 
            ADD CONSTRAINT fk_log_barang 
            FOREIGN KEY (barang_id) REFERENCES barang(barang_id) ON DELETE SET NULL;
        `);

        // 3. MIGRATE EXISTING DATA (Snapshotting)
        console.log('Migrating existing data...');

        // Update detail_transaksi from current barang
        await connection.query(`
            UPDATE detail_transaksi dt
            JOIN barang b ON dt.barang_id = b.barang_id
            SET dt.nama_barang = b.nama_barang, dt.harga_beli = b.harga_beli
            WHERE dt.nama_barang IS NULL;
        `);

        // Update stok_log from current barang
        await connection.query(`
            UPDATE stok_log sl
            JOIN barang b ON sl.barang_id = b.barang_id
            SET sl.nama_barang = b.nama_barang
            WHERE sl.nama_barang IS NULL;
        `);

        console.log('Migration Completed Successfully!');
        connection.release();
        process.exit(0);

    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
}

migrate();
