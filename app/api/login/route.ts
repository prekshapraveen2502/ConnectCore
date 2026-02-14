import { getConnection } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;
        const pool = await getConnection();

        // Call Stored Procedure
        const result = await pool.request()
            .input('Username', sql.VarChar, username)
            .input('Password', sql.VarChar, password)
            .execute('sp_ValidateAdminLogin');

        // Check result
        const isValid = result.recordset[0].IsValid;

        if (isValid === 1) {
            const response = NextResponse.json({ success: true });
            // Set a session cookie (expires when browser is closed)
            response.cookies.set('admin_session', 'true', {
                httpOnly: true,
                path: '/'
            });
            return response;
        } else {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }
    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
