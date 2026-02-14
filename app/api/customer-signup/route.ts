import { NextRequest, NextResponse } from 'next/server';
import { getConnection, sql } from '../../../lib/db';

export async function POST(request: NextRequest) {
    try {
        const { CustomerName, PhoneNumber, DOB, Email, Password } = await request.json();

        if (!CustomerName || !PhoneNumber || !DOB || !Email || !Password) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const pool = await getConnection();

        // Check if email already exists
        const emailCheck = await pool.request()
            .input('Email', sql.VarChar, Email)
            .query`SELECT CustomerID FROM CUSTOMER WHERE Email = @Email`;

        if (emailCheck.recordset.length > 0) {
            return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
        }

        // Create customer record
        const insertResult = await pool.request()
            .input('Name', sql.VarChar, CustomerName)
            .input('Phone', sql.VarChar, PhoneNumber)
            .input('DOB', sql.Date, DOB)
            .input('Email', sql.VarChar, Email)
            .input('Status', sql.VarChar, 'Active')
            .query`
                INSERT INTO CUSTOMER (CustomerName, PhoneNumber, DOB, Email, Status, StartDate)
                OUTPUT INSERTED.CustomerID
                VALUES (@Name, @Phone, @DOB, @Email, @Status, GETDATE())
            `;

        const newCustomerId = insertResult.recordset[0].CustomerID;

        // Generate username: Name(no spaces) + CustomerID
        const username = CustomerName.replace(/\s/g, '') + newCustomerId;

        // Create login record
        await pool.request()
            .input('CustomerID', sql.Int, newCustomerId)
            .input('Username', sql.VarChar, username)
            .input('Password', sql.VarChar, Password)
            .input('Email', sql.VarChar, Email)
            .query`
                INSERT INTO CUSTOMER_LOGIN (CustomerID, Username, Password, Email)
                VALUES (@CustomerID, @Username, @Password, @Email)
            `;

        return NextResponse.json({
            success: true,
            customerId: newCustomerId,
            username: username,
            message: `Account created! Your username is: ${username}`
        });

    } catch (error) {
        console.error('Customer Signup Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
