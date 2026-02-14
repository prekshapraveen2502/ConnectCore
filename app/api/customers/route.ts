import { getConnection } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';

export async function GET(request: NextRequest) {
    try {
        const pool = await getConnection();
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';

        let query = `
            SELECT TOP 50 
                CustomerID, 
                CustomerName, 
                PhoneNumber,
                Email,
                DOB,
                DATEDIFF(YEAR, DOB, GETDATE()) - CASE WHEN DATEADD(YEAR, DATEDIFF(YEAR, DOB, GETDATE()), DOB) > GETDATE() THEN 1 ELSE 0 END as Age,
                Status 
            FROM CUSTOMER 
            WHERE 1=1
        `;

        const requestObj = pool.request();

        if (search) {
            query += ` AND (CustomerName LIKE @search OR CustomerID LIKE @search)`;
            requestObj.input('search', sql.VarChar, `%${search}%`);
        }

        if (status && status !== 'All') {
            query += ` AND Status = @status`;
            requestObj.input('status', sql.VarChar, status);
        }

        query += ` ORDER BY CustomerID DESC`;

        const result = await requestObj.query(query);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Customers API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { CustomerName, PhoneNumber, DOB, Status, Email } = body;
        const pool = await getConnection();

        await pool.request()
            .input('Name', sql.VarChar, CustomerName)
            .input('Phone', sql.VarChar, PhoneNumber)
            .input('DOB', sql.Date, DOB)
            .input('Status', sql.VarChar, Status)
            .input('Email', sql.VarChar, Email || null)
            .query`INSERT INTO CUSTOMER (CustomerName, PhoneNumber, DOB, Status, Email, StartDate) VALUES (@Name, @Phone, @DOB, @Status, @Email, GETDATE())`;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Create Customer Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { CustomerID, CustomerName, PhoneNumber, DOB, Status, Email } = body;
        const pool = await getConnection();

        await pool.request()
            .input('ID', sql.Int, CustomerID)
            .input('Name', sql.VarChar, CustomerName)
            .input('Phone', sql.VarChar, PhoneNumber)
            .input('DOB', sql.Date, DOB)
            .input('Status', sql.VarChar, Status)
            .input('Email', sql.VarChar, Email || null)
            .query`
                UPDATE CUSTOMER 
                SET CustomerName = @Name, PhoneNumber = @Phone, DOB = @DOB, Status = @Status, Email = @Email
                WHERE CustomerID = @ID
            `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update Customer Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
