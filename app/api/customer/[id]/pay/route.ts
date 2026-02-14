import { getConnection } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customerId = parseInt(id);
        if (isNaN(customerId)) {
            return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
        }

        const { billId } = await request.json();
        if (!billId) {
            return NextResponse.json({ error: 'Bill ID is required' }, { status: 400 });
        }

        const pool = await getConnection();

        // Mark the bill as Paid — only if it belongs to this customer
        const result = await pool.request()
            .input('BillID', sql.Int, billId)
            .input('CustID', sql.Int, customerId)
            .query`
                UPDATE BILL 
                SET Status = 'Paid'
                WHERE BillID = @BillID AND CustomerID = @CustID AND Status = 'Pending'
            `;

        if (result.rowsAffected[0] === 0) {
            return NextResponse.json({ error: 'Bill not found or already paid' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Pay Bill API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
