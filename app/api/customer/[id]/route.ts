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

        // Fetch customer info
        const customerResult = await pool.request()
            .input('ID', sql.Int, customerId)
            .query`
                SELECT 
                    CustomerID, 
                    CustomerName, 
                    PhoneNumber, 
                    DOB, 
                    Status,
                    StartDate
                FROM CUSTOMER 
                WHERE CustomerID = @ID
            `;

        if (customerResult.recordset.length === 0) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        const customer = customerResult.recordset[0];

        // Try to fetch current plan — gracefully handle if CUSTOMER_PLAN table doesn't exist
        let currentPlan = null;
        try {
            const planResult = await pool.request()
                .input('CustID', sql.Int, customerId)
                .query`
                    SELECT TOP 1
                        p.PlanID,
                        p.PlanName,
                        p.DataLimit,
                        p.Description,
                        p.PlanType,
                        cp.StartDate as PlanStartDate
                    FROM CUSTOMER_PLAN cp
                    INNER JOIN [PLAN] p ON cp.PlanID = p.PlanID
                    WHERE cp.CustomerID = @CustID
                    ORDER BY cp.StartDate DESC
                `;
            if (planResult.recordset.length > 0) {
                currentPlan = planResult.recordset[0];
            }
        } catch {
            // CUSTOMER_PLAN table may not exist yet — that's okay
            console.log('CUSTOMER_PLAN table not found, skipping plan lookup');
        }

        return NextResponse.json({ customer, currentPlan });
    } catch (error) {
        console.error('Customer Detail API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
