import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const store_id = request.headers.get('x-store-id');
        if (!store_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const formData = await request.formData();

        const nama_barang = formData.get('nama_barang') as string;
        const harga_beli = parseFloat(formData.get('harga_beli') as string);
        const harga_jual = parseFloat(formData.get('harga_jual') as string);
        const stok = parseInt(formData.get('stok') as string);
        const stok_minimum = parseInt(formData.get('stok_minimum') as string);
        const satuan = formData.get('satuan') as string;
        const user_id = formData.get('user_id') ? parseInt(formData.get('user_id') as string) : null;
        const file = formData.get('image') as File | null;

        // Get old stock first for logging and ensure it belongs to the store
        const { rows: oldItem } = await pool.query('SELECT stok FROM barang WHERE barang_id = $1 AND store_id = $2', [id, store_id]);
        if (oldItem.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const oldStok = oldItem[0]?.stok || 0;
        const diff = stok - oldStok;

        let query = 'UPDATE barang SET nama_barang = $1, harga_beli = $2, harga_jual = $3, stok = $4, stok_minimum = $5, satuan = $6';
        const queryParams: any[] = [nama_barang, harga_beli, harga_jual, stok, stok_minimum, satuan];
        let paramIndex = 7;

        if (file) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            const savePath = path.join(uploadDir, filename);
            await writeFile(savePath, buffer);

            query += `, gambar = $${paramIndex}`;
            queryParams.push(`/uploads/${filename}`);
            paramIndex++;
        }

        query += ` WHERE barang_id = $${paramIndex} AND store_id = $${paramIndex + 1}`;
        queryParams.push(id, store_id);

        await pool.query(query, queryParams);

        if (diff !== 0) {
            await pool.query(
                'INSERT INTO stok_log (barang_id, nama_barang, user_id, jenis, jumlah, keterangan, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [id, nama_barang, user_id, diff > 0 ? 'masuk' : 'penyesuaian', Math.abs(diff), 'Edit Manual', store_id]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Database/Upload Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const store_id = request.headers.get('x-store-id');
        if (!store_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        // Attempt Hard Delete (Constraints updated to SET NULL)
        try {
            const { rowCount } = await pool.query('DELETE FROM barang WHERE barang_id = $1 AND store_id = $2', [id, store_id]);
            if (rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            return NextResponse.json({ success: true });
        } catch (dbError: any) {
            // Postgres foreign key violation is code '23503'
            if (dbError.code === '23503') {
                return NextResponse.json({
                    error: 'Barang tidak dapat dihapus permanen karena memiliki riwayat transaksi atau stok log.'
                }, { status: 409 });
            }
            throw dbError;
        }

    } catch (error) {
        console.error('Delete Error:', error);
        return NextResponse.json({ error: 'Gagal menghapus barang.' }, { status: 500 });
    }
}
