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

        const { planId } = await request.json();
        if (!planId) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
        }

        const pool = await getConnection();

        // Verify the plan exists
        const planCheck = await pool.request()
            .input('PlanID', sql.Int, planId)
            .query`SELECT PlanID FROM [PLAN] WHERE PlanID = @PlanID`;

        if (planCheck.recordset.length === 0) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        // Check if customer already has a plan record
        try {
            const existing = await pool.request()
                .input('CustID', sql.Int, customerId)
                .query`SELECT CustomerPlanID FROM CUSTOMER_PLAN WHERE CustomerID = @CustID`;

            if (existing.recordset.length > 0) {
                // Update existing plan
                await pool.request()
                    .input('CustID', sql.Int, customerId)
                    .input('PlanID', sql.Int, planId)
                    .query`
                        UPDATE CUSTOMER_PLAN 
                        SET PlanID = @PlanID, StartDate = GETDATE()
                        WHERE CustomerID = @CustID
                    `;
            } else {
                // Insert new plan assignment
                await pool.request()
                    .input('CustID', sql.Int, customerId)
                    .input('PlanID', sql.Int, planId)
                    .query`
                        INSERT INTO CUSTOMER_PLAN (CustomerID, PlanID, StartDate)
                        VALUES (@CustID, @PlanID, GETDATE())
                    `;
            }
        } catch {
            // CUSTOMER_PLAN table may not exist — try to create it and insert
            console.log('CUSTOMER_PLAN table not found, attempting to create...');
            await pool.request().query`
                CREATE TABLE CUSTOMER_PLAN (
                    CustomerPlanID INT IDENTITY(1,1) PRIMARY KEY,
                    CustomerID INT NOT NULL,
                    PlanID INT NOT NULL,
                    StartDate DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(CustomerID),
                    FOREIGN KEY (PlanID) REFERENCES [PLAN](PlanID)
                )
            `;
            await pool.request()
                .input('CustID', sql.Int, customerId)
                .input('PlanID', sql.Int, planId)
                .query`
                    INSERT INTO CUSTOMER_PLAN (CustomerID, PlanID, StartDate)
                    VALUES (@CustID, @PlanID, GETDATE())
                `;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Change Plan API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
