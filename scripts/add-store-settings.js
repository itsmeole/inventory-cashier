const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log('Creating store_settings table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS store_settings (
                id SERIAL PRIMARY KEY,
                nama_toko VARCHAR(100) DEFAULT 'WARDIG - Warung Digital',
                jalan VARCHAR(255) DEFAULT 'Gang lurah Kp Mekarsari',
                rt_rw VARCHAR(50) DEFAULT 'RT 04/ RW 02',
                kecamatan VARCHAR(100) DEFAULT 'Kec Bungursari',
                kabupaten VARCHAR(100) DEFAULT 'Kab Purwakarta',
                provinsi VARCHAR(100) DEFAULT 'Jawa Barat'
            );
        `);
        
        console.log('Inserting default record...');
        await pool.query(`
            INSERT INTO store_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
        `);
        
        console.log('Done!');
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

main();
