import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const store_id = request.headers.get('x-store-id');
        if (!store_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { rows } = await pool.query('SELECT * FROM transaksi WHERE store_id = $1 ORDER BY tanggal_transaksi DESC', [store_id]);
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const store_id = request.headers.get('x-store-id');
    if (!store_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await pool.connect();
    try {
        const body = await request.json();
        const { items, total_harga, bayar, kembalian, metode_pembayaran, user_id } = body;

        await client.query('BEGIN');

        // Insert Transaction Header
        const { rows: transResult } = await client.query(
            'INSERT INTO transaksi (user_id, total_harga, bayar, kembalian, metode_pembayaran, store_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING transaksi_id',
            [user_id, total_harga, bayar, kembalian, metode_pembayaran, store_id]
        );
        const transaksi_id = transResult[0].transaksi_id;

        // Insert Details
        for (const item of items) {
            const { barang_id, qty, harga_satuan } = item;
            const subtotal = qty * harga_satuan;

            // Check Stock & Get Details
            const { rows: stockCheck } = await client.query(
                'SELECT nama_barang, harga_beli, stok FROM barang WHERE barang_id = $1 AND store_id = $2 FOR UPDATE',
                [barang_id, store_id]
            );

            if (stockCheck.length === 0) {
                throw new Error(`Barang ID ${barang_id} tidak ditemukan`);
            }

            const { nama_barang, harga_beli, stok } = stockCheck[0];
            // Convert to number because pg might return decimal/numeric as string
            const currentStok = parseFloat(stok);
            const qtyNum = parseFloat(qty);

            if (currentStok < qtyNum) {
                throw new Error(`Stok tidak cukup untuk ${nama_barang}`);
            }

            // Insert Detail with Snapshot
            await client.query(
                'INSERT INTO detail_transaksi (transaksi_id, barang_id, nama_barang, harga_beli, qty, harga_satuan, subtotal) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [transaksi_id, barang_id, nama_barang, harga_beli, qty, harga_satuan, subtotal]
            );

            // Decrease Stock
            await client.query(
                'UPDATE barang SET stok = stok - $1 WHERE barang_id = $2 AND store_id = $3',
                [qty, barang_id, store_id]
            );

            // Log Stock Out with Snapshot
            await client.query(
                'INSERT INTO stok_log (barang_id, nama_barang, user_id, jenis, jumlah, keterangan, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [barang_id, nama_barang, user_id || null, 'keluar', qty, `Penjualan #${transaksi_id}`, store_id]
            );
        }

        await client.query('COMMIT');
        return NextResponse.json({ success: true, transaksi_id });

    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error(error);
        return NextResponse.json({ error: error.message || 'Transaction Failed' }, { status: 500 });
    } finally {
        client.release();
    }
}
