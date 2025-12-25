import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { username, password, nama, role } = body;

        let query = 'UPDATE users SET username = ?, nama = ?, role = ? WHERE user_id = ?';
        let values = [username, nama, role, id];

        if (password && password.trim() !== '') {
            query = 'UPDATE users SET username = ?, nama = ?, role = ?, password = ? WHERE user_id = ?';
            values = [username, nama, role, password, id];
        }

        await pool.query(query, values);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await pool.query('DELETE FROM users WHERE user_id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
