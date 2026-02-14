import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { nama, username, role, password } = body;

        if (password && password.trim() !== '') {
            await pool.query(
                'UPDATE users SET nama = $1, username = $2, role = $3, password = $4 WHERE user_id = $5',
                [nama, username, role, password, id]
            );
        } else {
            await pool.query(
                'UPDATE users SET nama = $1, username = $2, role = $3 WHERE user_id = $4',
                [nama, username, role, id]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Gagal update user' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await pool.query('DELETE FROM users WHERE user_id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Gagal hapus user' }, { status: 500 });
    }
}
