import { NextRequest, NextResponse } from 'next/server';
import { getConnection, sql } from '../../../lib/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const pool = await getConnection();

        // Find customer login by email
        const result = await pool.request()
            .input('Email', sql.VarChar, email)
            .query`SELECT LoginID, Username FROM CUSTOMER_LOGIN WHERE Email = @Email`;

        if (result.recordset.length === 0) {
            // Don't reveal if email exists or not for security
            return NextResponse.json({
                success: true,
                message: 'If an account with that email exists, a reset link has been sent.'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        // Save token to DB
        await pool.request()
            .input('Token', sql.VarChar, resetToken)
            .input('Expiry', sql.DateTime, expiry)
            .input('Email', sql.VarChar, email)
            .query`
                UPDATE CUSTOMER_LOGIN
                SET ResetToken = @Token, ResetTokenExpiry = @Expiry
                WHERE Email = @Email
            `;

        // Send email
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        // Log reset URL to console for testing
        console.log(`\n🔗 Password reset link for ${email}:\n${resetUrl}\n`);

        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: email,
                subject: 'Telecom Portal - Password Reset',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 30px; background: #0f172a; color: #e2e8f0; border-radius: 12px;">
                        <h2 style="color: #38bdf8; margin-bottom: 20px;">Password Reset Request</h2>
                        <p>You requested a password reset for your Telecom Portal account.</p>
                        <p>Your username is: <strong>${result.recordset[0].Username}</strong></p>
                        <a href="${resetUrl}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; background: #38bdf8; color: #000; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Reset Password
                        </a>
                        <p style="font-size: 0.85rem; color: #94a3b8;">This link will expire in 1 hour. If you didn't request this, ignore this email.</p>
                    </div>
                `,
            });
            console.log('✅ Reset email sent successfully');
        } catch (emailError) {
            console.warn('⚠️  Email sending failed (SMTP not configured?):', (emailError as Error).message);
            console.log('   Use the reset link from the console log above to test the flow.');
        }

        return NextResponse.json({
            success: true,
            message: 'If an account with that email exists, a reset link has been sent.',
            // Return link in response only for dev testing
            debugLink: process.env.NODE_ENV !== 'production' ? resetUrl : undefined
        });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        return NextResponse.json({ error: 'Failed to process request. Please try again.' }, { status: 500 });
    }
}
