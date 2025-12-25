import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
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

        // Get old stock first for logging
        const [oldItem] = await pool.query<any[]>('SELECT stok FROM barang WHERE barang_id = ?', [id]);
        const oldStok = oldItem[0]?.stok || 0;
        const diff = stok - oldStok;

        let query = 'UPDATE barang SET nama_barang = ?, harga_beli = ?, harga_jual = ?, stok = ?, stok_minimum = ?, satuan = ?';
        const queryParams: any[] = [nama_barang, harga_beli, harga_jual, stok, stok_minimum, satuan];

        if (file) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            const savePath = path.join(uploadDir, filename);
            await writeFile(savePath, buffer);

            query += ', gambar = ?';
            queryParams.push(`/uploads/${filename}`);
        }

        query += ' WHERE barang_id = ?';
        queryParams.push(id);

        await pool.query(query, queryParams);

        if (diff !== 0) {
            await pool.query(
                'INSERT INTO stok_log (barang_id, nama_barang, user_id, jenis, jumlah, keterangan) VALUES (?, ?, ?, ?, ?, ?)',
                [id, nama_barang, user_id, diff > 0 ? 'masuk' : 'penyesuaian', Math.abs(diff), 'Edit Manual']
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
        const { id } = await params;

        // Attempt Hard Delete (Constraints updated to SET NULL)
        await pool.query('DELETE FROM barang WHERE barang_id = ?', [id]);
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Delete Error:', error);
        return NextResponse.json({ error: 'Gagal menghapus barang.' }, { status: 500 });
    }
}
