import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const response = NextResponse.json({ success: true });

    // Clear both admin and customer session cookies
    response.cookies.delete('admin_session');
    response.cookies.delete('customer_session');

    return response;
}
