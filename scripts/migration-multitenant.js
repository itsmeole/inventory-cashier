const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log('Starting migration...');

        // 1. Rename store_settings to stores
        console.log('Renaming store_settings...');
        await pool.query('ALTER TABLE IF EXISTS store_settings RENAME TO stores;');
        await pool.query('ALTER TABLE stores RENAME COLUMN id TO store_id;');

        // 2. Add store_id to users
        console.log('Updating users table...');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS store_id INT;');
        await pool.query('UPDATE users SET store_id = 1 WHERE store_id IS NULL;');
        // Note: For now, if store 1 doesn't exist, we assume it does because of our prev script.
        try {
            await pool.query('ALTER TABLE users ADD CONSTRAINT fk_user_store FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE;');
        } catch (e) {
            console.log('FK fk_user_store might already exist', e.message);
        }

        // 3. Add store_id to barang
        console.log('Updating barang table...');
        await pool.query('ALTER TABLE barang ADD COLUMN IF NOT EXISTS store_id INT;');
        await pool.query('UPDATE barang SET store_id = 1 WHERE store_id IS NULL;');
        try {
            await pool.query('ALTER TABLE barang ADD CONSTRAINT fk_barang_store FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE;');
        } catch (e) { console.log(e.message) }

        // 4. Add store_id to transaksi
        console.log('Updating transaksi table...');
        await pool.query('ALTER TABLE transaksi ADD COLUMN IF NOT EXISTS store_id INT;');
        await pool.query('UPDATE transaksi SET store_id = 1 WHERE store_id IS NULL;');
        try {
            await pool.query('ALTER TABLE transaksi ADD CONSTRAINT fk_trans_store FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE;');
        } catch (e) { console.log(e.message) }

        // 5. Add store_id to stok_log
        console.log('Updating stok_log table...');
        await pool.query('ALTER TABLE stok_log ADD COLUMN IF NOT EXISTS store_id INT;');
        await pool.query('UPDATE stok_log SET store_id = 1 WHERE store_id IS NULL;');
        try {
            await pool.query('ALTER TABLE stok_log ADD CONSTRAINT fk_log_store FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE;');
        } catch (e) { console.log(e.message) }

        console.log('Migration completed successfully!');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        pool.end();
    }
}

main();
