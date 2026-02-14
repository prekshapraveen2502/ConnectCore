"use client";

import Link from 'next/link';
import '../globals.css';

export default function BillingPage() {
    return (
        <main className="dashboard">
            <header className="header">
                <h1>Bill <span>Payment</span></h1>
                <p>View unpaid bills and process payments</p>
                <Link href="/" style={{ marginTop: '20px', display: 'inline-block', color: 'var(--accent-color)' }}>
                    &larr; Back to Dashboard
                </Link>
            </header>

            <section className="stats-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="card">
                    <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        Billing page coming soon...
                    </p>
                </div>
            </section>
        </main>
    );
}
