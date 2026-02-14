import { NextRequest, NextResponse } from 'next/server';
import { getConnection, sql } from '../../../lib/db';

export async function POST(request: NextRequest) {
    try {
        const { token, newPassword } = await request.json();

        if (!token || !newPassword) {
            return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        const pool = await getConnection();

        // Find token and check validity
        const result = await pool.request()
            .input('Token', sql.VarChar, token)
            .query`
                SELECT LoginID, ResetTokenExpiry
                FROM CUSTOMER_LOGIN
                WHERE ResetToken = @Token
            `;

        if (result.recordset.length === 0) {
            return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
        }

        const { LoginID, ResetTokenExpiry } = result.recordset[0];

        // Check if token has expired
        if (new Date() > new Date(ResetTokenExpiry)) {
            return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 });
        }

        // Update password and clear token
        await pool.request()
            .input('LoginID', sql.Int, LoginID)
            .input('Password', sql.VarChar, newPassword)
            .query`
                UPDATE CUSTOMER_LOGIN
                SET Password = @Password, ResetToken = NULL, ResetTokenExpiry = NULL
                WHERE LoginID = @LoginID
            `;

        return NextResponse.json({ success: true, message: 'Password updated successfully!' });

    } catch (error) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
