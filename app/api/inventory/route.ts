import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import supabase from '@/lib/supabase';
import { compressImage, generateStorageFilename } from '@/lib/image-utils';

const BUCKET_NAME = 'product-images';
// Cache 7 hari — gambar produk jarang berubah, CDN Supabase akan cache
const CACHE_CONTROL = '604800';

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

        query += ' ORDER BY created_at DESC';

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
        const user_id = formData.get('user_id') as string | null;
        const file = formData.get('image') as File | null;
        const info_satuan_beli = formData.get('info_satuan_beli') as string || 'Pcs';
        const info_jumlah_beli = parseFloat(formData.get('info_jumlah_beli') as string) || stok;

        if (!nama_barang || isNaN(harga_beli) || isNaN(harga_jual)) {
            return NextResponse.json({ error: 'Data tidak lengkap. Harga Beli: ' + harga_beli + ' Harga Jual: ' + harga_jual }, { status: 400 });
        }

        let gambar: string | null = null;
        if (file) {
            const rawBuffer = Buffer.from(await file.arrayBuffer());

            // Kompresi + convert ke WebP sebelum upload
            const { buffer: compressedBuffer, contentType } = await compressImage(rawBuffer);
            const filename = generateStorageFilename(store_id, file.name);

            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(filename, compressedBuffer, {
                    contentType,
                    upsert: false,
                    cacheControl: CACHE_CONTROL, // CDN cache 7 hari
                });

            if (uploadError) {
                console.error('Supabase Storage upload error:', uploadError);
                return NextResponse.json({ error: 'Gagal upload gambar: ' + uploadError.message }, { status: 500 });
            }

            const { data: publicUrlData } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(filename);
            gambar = publicUrlData.publicUrl;
        }

        const { rows: result } = await pool.query(
            'INSERT INTO barang (nama_barang, harga_beli, harga_jual, stok, stok_minimum, satuan, gambar, is_deleted, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8) RETURNING barang_id',
            [nama_barang, harga_beli, harga_jual, stok, stok_minimum, satuan, gambar, store_id]
        );

        const newId = result[0].barang_id;

        if (stok > 0) {
            let initialLogDesc = 'Stok Awal';
            if (['Box', 'Pak'].includes(info_satuan_beli) || info_satuan_beli !== satuan) {
                initialLogDesc += ` (${info_jumlah_beli} ${info_satuan_beli})`;
            }

            await pool.query(
                'INSERT INTO stok_log (barang_id, nama_barang, user_id, jenis, jumlah, keterangan, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [newId, nama_barang, user_id || null, 'masuk', stok, initialLogDesc, store_id]
            );
        }

        return NextResponse.json({
            id: newId,
            nama_barang,
            harga_beli,
            harga_jual,
            stok,
            stok_minimum,
            gambar,
            satuan
        }, { status: 201 });

    } catch (error: any) {
        console.error('POST /api/inventory Error:', error);
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}
