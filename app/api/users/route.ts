import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const store_id = request.headers.get('x-store-id');
        if (!store_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { rows } = await pool.query('SELECT user_id, nama, username, role, created_at FROM users WHERE store_id = $1 ORDER BY created_at DESC', [store_id]);
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const store_id = request.headers.get('x-store-id');
        if (!store_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { nama, username, password, role } = body;

        // Check availability
        const { rows: check } = await pool.query('SELECT user_id FROM users WHERE username = $1', [username]);
        if (check.length > 0) {
            return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
        }

        const { rows: result } = await pool.query(
            'INSERT INTO users (nama, username, password, role, store_id) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
            [nama, username, password, role, store_id]
        );

        return NextResponse.json({ success: true, id: result[0].user_id }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Gagal menambah user' }, { status: 500 });
    }
}
