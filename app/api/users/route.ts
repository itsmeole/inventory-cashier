import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const [rows] = await pool.query('SELECT user_id, username, role, nama FROM users');
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password, nama, role } = body;

        // Simple plain text password for now as per existing schema prototype
        await pool.query(
            'INSERT INTO users (username, password, nama, role) VALUES (?, ?, ?, ?)',
            [username, password, nama, role]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
