import { getConnection } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customerId = parseInt(id);
        if (isNaN(customerId)) {
            return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
        }

        const pool = await getConnection();

        try {
            const result = await pool.request()
                .input('CustID', sql.Int, customerId)
                .query`
                    SELECT 
                        BillID,
                        CustomerID,
                        Amount,
                        BillDate,
                        DueDate,
                        Status
                    FROM BILL
                    WHERE CustomerID = @CustID
                    ORDER BY BillDate DESC
                `;

            return NextResponse.json(result.recordset);
        } catch {
            // BILL table may not exist yet
            console.log('BILL table not found');
            return NextResponse.json([]);
        }
    } catch (error) {
        console.error('Customer Bills API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
