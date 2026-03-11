import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { nama, username, password } = await request.json();

        if (!nama || !username || !password) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
        }

        // 1. Check if username exists
        const { rows: existingUser } = await pool.query(
            'SELECT username FROM users WHERE username = $1',
            [username]
        );

        if (existingUser.length > 0) {
            return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
        }

        // 2. Create new store (tenant)
        const { rows: insertStore } = await pool.query(`
            INSERT INTO stores (nama_toko) VALUES ('') RETURNING store_id;
        `);
        const newStoreId = insertStore[0].store_id;

        // 3. Create new user with admin role tied to new store
        const { rows: insertUser } = await pool.query(`
            INSERT INTO users (nama, username, password, role, store_id)
            VALUES ($1, $2, $3, 'admin', $4)
            RETURNING user_id, store_id, username, nama, role
        `, [nama, username, password, newStoreId]);

        const newUser = insertUser[0];

        return NextResponse.json({ user: newUser });
    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}
