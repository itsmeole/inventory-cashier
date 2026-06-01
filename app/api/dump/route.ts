import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * Escape nilai SQL untuk INSERT statements.
 * Handles null, numbers, booleans, dates, and strings.
 */
function escapeValue(val: any): string {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val.toString();
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    // Escape single quotes dan backslash
    const str = String(val).replace(/\\/g, '\\\\').replace(/'/g, "''");
    return `'${str}'`;
}

/**
 * Generate INSERT statements dari array rows dan nama tabel.
 */
function generateInserts(tableName: string, rows: any[]): string {
    if (rows.length === 0) return `-- Tabel ${tableName}: tidak ada data\n`;

    const columns = Object.keys(rows[0]);
    const colList = columns.map(c => `"${c}"`).join(', ');

    const inserts = rows.map(row => {
        const values = columns.map(col => escapeValue(row[col])).join(', ');
        return `INSERT INTO public.${tableName} (${colList}) VALUES (${values});`;
    }).join('\n');

    return `-- === ${tableName.toUpperCase()} (${rows.length} baris) ===\n${inserts}\n`;
}

export async function GET(request: Request) {
    try {
        const store_id = request.headers.get('x-store-id');
        if (!store_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Query semua data milik toko ini
        const [stores, users, barang, transaksi, detailTransaksi, stokLog] = await Promise.all([
            pool.query('SELECT * FROM public.stores WHERE store_id = $1', [store_id]),
            pool.query('SELECT user_id, nama, username, role, created_at, store_id FROM public.users WHERE store_id = $1 ORDER BY created_at', [store_id]),
            pool.query('SELECT * FROM public.barang WHERE store_id = $1 ORDER BY created_at', [store_id]),
            pool.query('SELECT * FROM public.transaksi WHERE store_id = $1 ORDER BY tanggal_transaksi', [store_id]),
            pool.query(`
                SELECT dt.* FROM public.detail_transaksi dt
                JOIN public.transaksi t ON dt.transaksi_id = t.transaksi_id
                WHERE t.store_id = $1
                ORDER BY dt.detail_id
            `, [store_id]),
            pool.query('SELECT * FROM public.stok_log WHERE store_id = $1 ORDER BY tanggal', [store_id]),
        ]);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const storeName = stores.rows[0]?.nama_toko || 'toko';

        // Bangun isi file SQL
        const sqlContent = [
            `-- ============================================================`,
            `-- SQL DATA DUMP`,
            `-- Toko   : ${storeName}`,
            `-- Store ID: ${store_id}`,
            `-- Dibuat : ${new Date().toLocaleString('id-ID')}`,
            `-- Gunakan database-uuid.sql untuk schema sebelum restore ini`,
            `-- ============================================================`,
            ``,
            `BEGIN;`,
            ``,
            generateInserts('stores', stores.rows),
            generateInserts('users', users.rows),
            generateInserts('barang', barang.rows),
            generateInserts('transaksi', transaksi.rows),
            generateInserts('detail_transaksi', detailTransaksi.rows),
            generateInserts('stok_log', stokLog.rows),
            ``,
            `COMMIT;`,
            ``,
            `-- Selesai. Total:`,
            `-- Stores: ${stores.rows.length}`,
            `-- Users: ${users.rows.length}`,
            `-- Barang: ${barang.rows.length}`,
            `-- Transaksi: ${transaksi.rows.length}`,
            `-- Detail Transaksi: ${detailTransaksi.rows.length}`,
            `-- Stok Log: ${stokLog.rows.length}`,
        ].join('\n');

        const filename = `dump-${storeName.replace(/\s+/g, '_').toLowerCase()}-${timestamp}.sql`;

        return new NextResponse(sqlContent, {
            status: 200,
            headers: {
                'Content-Type': 'application/sql',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error: any) {
        console.error('Dump error:', error);
        return NextResponse.json({ error: 'Gagal membuat dump: ' + error.message }, { status: 500 });
    }
}
