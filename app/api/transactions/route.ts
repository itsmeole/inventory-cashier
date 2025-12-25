import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(request: Request) {
    const connection = await pool.getConnection(); // Get dedicated connection for transaction
    try {
        const body = await request.json();
        const { user_id, items, total_harga, metode_pembayaran } = body;
        // items: [{ barang_id, qty, harga_satuan }]

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
        }

        await connection.beginTransaction();

        // 1. Create Transaction Header
        const [transResult] = await connection.query<ResultSetHeader>(
            'INSERT INTO transaksi (user_id, total_harga, metode_pembayaran) VALUES (?, ?, ?)',
            [user_id || 1, total_harga, metode_pembayaran || 'Tunai'] // Default user_id 1 (Admin) if not sent
        );
        const transaksi_id = transResult.insertId;

        // 2. Process Items
        for (const item of items) {
            const { barang_id, qty, harga_satuan } = item;
            const subtotal = qty * harga_satuan;

            // Check Stock & Get Details
            const [stockCheck] = await connection.query<RowDataPacket[]>(
                'SELECT nama_barang, harga_beli, stok FROM barang WHERE barang_id = ? FOR UPDATE',
                [barang_id]
            );

            if (stockCheck.length === 0) {
                throw new Error(`Barang ID ${barang_id} tidak ditemukan`);
            }

            const { nama_barang, harga_beli, stok } = stockCheck[0];

            if (stok < qty) {
                throw new Error(`Stok tidak cukup untuk ${nama_barang}`);
            }

            // Insert Detail with Snapshot
            await connection.query(
                'INSERT INTO detail_transaksi (transaksi_id, barang_id, nama_barang, harga_beli, qty, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [transaksi_id, barang_id, nama_barang, harga_beli, qty, harga_satuan, subtotal]
            );

            // Decrease Stock
            await connection.query(
                'UPDATE barang SET stok = stok - ? WHERE barang_id = ?',
                [qty, barang_id]
            );

            // Log Stock Out with Snapshot
            await connection.query(
                'INSERT INTO stok_log (barang_id, nama_barang, user_id, jenis, jumlah, keterangan) VALUES (?, ?, ?, ?, ?, ?)',
                [barang_id, nama_barang, user_id || null, 'keluar', qty, `Penjualan #${transaksi_id}`]
            );
        }

        await connection.commit();
        return NextResponse.json({ success: true, transaksi_id }, { status: 201 });

    } catch (error: any) {
        await connection.rollback();
        console.error('Transaction Error:', error);
        return NextResponse.json({ error: error.message || 'Transaction Failed' }, { status: 500 });
    } finally {
        connection.release();
    }
}

export async function GET(request: Request) {
    try {
        const [rows] = await pool.query('SELECT t.*, u.nama as kasir FROM transaksi t LEFT JOIN users u ON t.user_id = u.user_id ORDER BY t.tanggal_transaksi DESC LIMIT 50');
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }
}
