import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import supabase from '@/lib/supabase';
import { compressImage, generateStorageFilename, extractStoragePath } from '@/lib/image-utils';

const BUCKET_NAME = 'product-images';
const CACHE_CONTROL = '604800'; // 7 hari

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
        const user_id = formData.get('user_id') as string | null;
        const file = formData.get('image') as File | null;
        const info_satuan_beli = formData.get('info_satuan_beli') as string || 'Pcs';
        const info_jumlah_beli = parseFloat(formData.get('info_jumlah_beli') as string) || stok;

        // Get old stock & gambar, pastikan barang milik toko ini
        const { rows: oldItem } = await pool.query(
            'SELECT stok, gambar FROM barang WHERE barang_id = $1 AND store_id = $2',
            [id, store_id]
        );
        if (oldItem.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const oldStok = oldItem[0]?.stok || 0;
        const diff = stok - oldStok;

        let query = 'UPDATE barang SET nama_barang = $1, harga_beli = $2, harga_jual = $3, stok = $4, stok_minimum = $5, satuan = $6, updated_at = CURRENT_TIMESTAMP';
        const queryParams: any[] = [nama_barang, harga_beli, harga_jual, stok, stok_minimum, satuan];
        let paramIndex = 7;

        if (file) {
            const rawBuffer = Buffer.from(await file.arrayBuffer());

            // Kompresi + convert ke WebP
            const { buffer: compressedBuffer, contentType } = await compressImage(rawBuffer);
            const filename = generateStorageFilename(store_id, file.name);

            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(filename, compressedBuffer, {
                    contentType,
                    upsert: false,
                    cacheControl: CACHE_CONTROL,
                });

            if (uploadError) {
                console.error('Supabase Storage upload error:', uploadError);
                return NextResponse.json({ error: 'Gagal upload gambar: ' + uploadError.message }, { status: 500 });
            }

            // Hapus gambar lama dari bucket agar tidak numpuk
            const oldGambar = oldItem[0]?.gambar;
            if (oldGambar) {
                const oldPath = extractStoragePath(oldGambar, BUCKET_NAME);
                if (oldPath) {
                    await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
                }
            }

            const { data: publicUrlData } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(filename);

            query += `, gambar = $${paramIndex}`;
            queryParams.push(publicUrlData.publicUrl);
            paramIndex++;
        }

        query += ` WHERE barang_id = $${paramIndex} AND store_id = $${paramIndex + 1}`;
        queryParams.push(id, store_id);

        await pool.query(query, queryParams);

        if (diff !== 0) {
            let editLogDesc = 'Edit Manual';
            if (diff > 0 && (['Box', 'Pak'].includes(info_satuan_beli) || info_satuan_beli !== satuan)) {
                editLogDesc += ` (+${info_jumlah_beli} ${info_satuan_beli})`;
            }

            await pool.query(
                'INSERT INTO stok_log (barang_id, nama_barang, user_id, jenis, jumlah, keterangan, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [id, nama_barang, user_id || null, diff > 0 ? 'masuk' : 'penyesuaian', Math.abs(diff), editLogDesc, store_id]
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

        // Ambil path gambar sebelum dihapus dari database
        const { rows: item } = await pool.query(
            'SELECT gambar FROM barang WHERE barang_id = $1 AND store_id = $2',
            [id, store_id]
        );

        try {
            const { rowCount } = await pool.query('DELETE FROM barang WHERE barang_id = $1 AND store_id = $2', [id, store_id]);
            if (rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

            // Hapus gambar dari Supabase Storage
            if (item.length > 0 && item[0].gambar) {
                const storagePath = extractStoragePath(item[0].gambar, BUCKET_NAME);
                if (storagePath) {
                    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
                }
            }

            return NextResponse.json({ success: true });
        } catch (dbError: any) {
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
