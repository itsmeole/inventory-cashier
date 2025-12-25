import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';

        let query = 'SELECT * FROM barang WHERE is_deleted = 0';
        const params: any[] = [];

        if (search) {
            query += ' AND nama_barang LIKE ?';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY barang_id DESC';

        const [rows] = await pool.query<RowDataPacket[]>(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }
}

import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const nama_barang = formData.get('nama_barang') as string;
        const harga_beli = parseFloat(formData.get('harga_beli') as string);
        const harga_jual = parseFloat(formData.get('harga_jual') as string);
        const stok = parseFloat(formData.get('stok') as string) || 0;
        const stok_minimum = parseInt(formData.get('stok_minimum') as string);
        const satuan = formData.get('satuan') as string;
        const user_id = formData.get('user_id') ? parseInt(formData.get('user_id') as string) : null;
        const file = formData.get('image') as File | null;

        if (!nama_barang || isNaN(harga_beli) || isNaN(harga_jual)) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
        }

        let gambar = null;
        if (file) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            await writeFile(path.join(uploadDir, filename), buffer);
            gambar = `/uploads/${filename}`;
        }

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO barang (nama_barang, harga_beli, harga_jual, stok, stok_minimum, satuan, gambar, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
            [nama_barang, harga_beli, harga_jual, stok, stok_minimum, satuan, gambar]
        );

        // Record Log
        if (stok > 0) {
            await pool.query(
                'INSERT INTO stok_log (barang_id, nama_barang, user_id, jenis, jumlah, keterangan) VALUES (?, ?, ?, ?, ?, ?)',
                [result.insertId, nama_barang, user_id, 'masuk', stok, 'Stok Awal']
            );
        }

        return NextResponse.json({
            id: result.insertId,
            nama_barang,
            harga_beli,
            harga_jual,
            stok,
            stok_minimum,
            gambar: gambar,
            satuan
        }, { status: 201 });

    } catch (error) {
        console.error('POST /api/inventory Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
