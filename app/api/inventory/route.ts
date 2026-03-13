import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
    try {
        const store_id = request.headers.get('x-store-id');
        if (!store_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';

        let query = 'SELECT * FROM barang WHERE is_deleted = 0 AND store_id = $1';
        const params: any[] = [store_id];
        let paramIndex = 2;

        if (search) {
            query += ` AND nama_barang ILIKE $${paramIndex}`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ' ORDER BY barang_id DESC';

        const { rows } = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const store_id = request.headers.get('x-store-id');
        if (!store_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await request.formData();
        const nama_barang = formData.get('nama_barang') as string;
        const harga_beli = parseFloat(formData.get('harga_beli') as string);
        const harga_jual = parseFloat(formData.get('harga_jual') as string);
        const stok = parseFloat(formData.get('stok') as string) || 0;
        const stok_minimum = parseInt(formData.get('stok_minimum') as string);
        const satuan = formData.get('satuan') as string;
        const user_id = formData.get('user_id') ? parseInt(formData.get('user_id') as string) : null;
        const file = formData.get('image') as File | null;
        // Extraction for stok log
        const info_satuan_beli = formData.get('info_satuan_beli') as string || 'Pcs';
        const info_jumlah_beli = parseFloat(formData.get('info_jumlah_beli') as string) || stok;

        if (!nama_barang || isNaN(harga_beli) || isNaN(harga_jual)) {
            console.error('Data tidak lengkap/valid:', { nama_barang, harga_beliRaw: formData.get('harga_beli'), harga_beli, harga_jualRaw: formData.get('harga_jual'), harga_jual });
            return NextResponse.json({ error: 'Data tidak lengkap. Harga Beli: ' + harga_beli + ' Harga Jual: ' + harga_jual }, { status: 400 });
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

        const { rows: result } = await pool.query(
            'INSERT INTO barang (nama_barang, harga_beli, harga_jual, stok, stok_minimum, satuan, gambar, is_deleted, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8) RETURNING barang_id',
            [nama_barang, harga_beli, harga_jual, stok, stok_minimum, satuan, gambar, store_id]
        );

        const newId = result[0].barang_id;

        // Record Log
        if (stok > 0) {
            let initialLogDesc = 'Stok Awal';
            if (['Box', 'Pak'].includes(info_satuan_beli) || info_satuan_beli !== satuan) {
                initialLogDesc += ` (${info_jumlah_beli} ${info_satuan_beli})`;
            }

            await pool.query(
                'INSERT INTO stok_log (barang_id, nama_barang, user_id, jenis, jumlah, keterangan, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [newId, nama_barang, user_id, 'masuk', stok, initialLogDesc, store_id]
            );
        }

        return NextResponse.json({
            id: newId,
            nama_barang,
            harga_beli,
            harga_jual,
            stok,
            stok_minimum,
            gambar: gambar,
            satuan
        }, { status: 201 });

    } catch (error: any) {
        console.error('POST /api/inventory Error:', error);
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}
