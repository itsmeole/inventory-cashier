require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

console.log("Testing connection to:", process.env.DATABASE_URL?.split('@')[1]);

(async () => {
    try {
        const client = await pool.connect();
        console.log("✅ Connection Successful!");
        const res = await client.query('SELECT NOW()');
        console.log("Time from DB:", res.rows[0].now);
        client.release();
        process.exit(0);
    } catch (err) {
        console.error("❌ Connection Failed:", err.message);
        process.exit(1);
    }
})();
