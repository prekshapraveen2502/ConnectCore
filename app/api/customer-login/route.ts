import { NextRequest, NextResponse } from 'next/server';
import { getConnection, sql } from '../../../lib/db';

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        const pool = await getConnection();

        // Use the newly created stored procedure
        const result = await pool.request()
            .input('Username', sql.VarChar, username)
            .input('Password', sql.VarChar, password)
            .execute('sp_ValidateCustomerLogin');

        if (result.recordset.length > 0) {
            const customerId = result.recordset[0].CustomerID;

            const response = NextResponse.json({ success: true, customerId });

            // Set session cookie for customer
            response.cookies.set('customer_session', customerId.toString(), {
                httpOnly: true,
                path: '/'
            });

            return response;
        } else {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }
    } catch (error) {
        console.error('Customer Login Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
