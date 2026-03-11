import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const store_id = request.headers.get('x-store-id');
        if (!store_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { rows } = await pool.query('SELECT * FROM stores WHERE store_id = $1', [store_id]);
        if (rows.length === 0) {
            return NextResponse.json({
                nama_toko: '',
                jalan: '',
                rt_rw: '',
                kecamatan: '',
                kabupaten: '',
                provinsi: ''
            });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error('Failed to get store settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const store_id = request.headers.get('x-store-id');
        if (!store_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        
        // Also update the user's name if provided and if they passed a user_id
        if (body.user_id && body.nama_admin) {
             await pool.query(
                'UPDATE users SET nama = $1 WHERE user_id = $2 AND store_id = $3',
                [body.nama_admin, body.user_id, store_id]
             );
        }

        // Update the store settings
        const { rows } = await pool.query(`
            UPDATE stores SET 
                nama_toko = $1,
                jalan = $2,
                rt_rw = $3,
                kecamatan = $4,
                kabupaten = $5,
                provinsi = $6
            WHERE store_id = $7
            RETURNING *
        `, [
            body.nama_toko || 'WARDIG - Warung Digital',
            body.jalan || '',
            body.rt_rw || '',
            body.kecamatan || '',
            body.kabupaten || '',
            body.provinsi || '',
            store_id
        ]);

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error('Failed to update store settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
