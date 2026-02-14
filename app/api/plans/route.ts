import { getConnection } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';

export async function GET() {
    try {
        const pool = await getConnection();

        const result = await pool.request().query`
            SELECT 
                PlanID,
                PlanName,
                DataLimit,
                Description,
                PlanType
            FROM [PLAN]
            ORDER BY PlanID
        `;

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Plans API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { PlanName, DataLimit, Description, PlanType } = body;
        const pool = await getConnection();

        await pool.request()
            .input('Name', sql.VarChar, PlanName)
            .input('DataLimit', sql.Int, DataLimit)
            .input('Description', sql.VarChar, Description)
            .input('Type', sql.VarChar, PlanType)
            .query`INSERT INTO [PLAN] (PlanName, DataLimit, Description, PlanType, StartDate) VALUES (@Name, @DataLimit, @Description, @Type, GETDATE())`;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Create Plan Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { PlanID, PlanName, DataLimit, Description, PlanType } = body;
        const pool = await getConnection();

        await pool.request()
            .input('ID', sql.Int, PlanID)
            .input('Name', sql.VarChar, PlanName)
            .input('DataLimit', sql.Int, DataLimit)
            .input('Description', sql.VarChar, Description)
            .input('Type', sql.VarChar, PlanType)
            .query`
                UPDATE [PLAN] 
                SET PlanName = @Name, DataLimit = @DataLimit, Description = @Description, PlanType = @Type
                WHERE PlanID = @ID
            `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update Plan Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
        }

        const pool = await getConnection();
        await pool.request()
            .input('ID', sql.Int, id)
            .query`DELETE FROM [PLAN] WHERE PlanID = @ID`;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Plan Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
