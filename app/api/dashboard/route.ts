import { getConnection } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const pool = await getConnection();

        // Use Promise.all for parallel execution
        const [customerRes, planRes, billRes] = await Promise.all([
            pool.request().query`SELECT COUNT(*) as count FROM CUSTOMER`,
            pool.request().query`SELECT COUNT(*) as count FROM [PLAN]`,
            pool.request().query`SELECT COUNT(*) as count FROM BILL WHERE Status = 'Pending'`.catch(() => ({ recordset: [{ count: 0 }] })) // Fallback if BILL table missing
        ]);

        return NextResponse.json({
            totalCustomers: customerRes.recordset[0].count,
            activePlans: planRes.recordset[0].count,
            pendingBills: billRes.recordset ? billRes.recordset[0].count : 0
        });
    } catch (error) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
