"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../globals.css';
import PlanModal from './PlanModal';
import styles from './page.module.css';

type Plan = {
    PlanID?: number;
    PlanName: string;
    DataLimit: number;
    Description: string;
    PlanType: string;
};

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    const [authLoading, setAuthLoading] = useState(true);
    const router = useRouter();

    const fetchPlans = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/plans');
            if (!res.ok) throw new Error('Failed to fetch plans');
            const data = await res.json();
            setPlans(data);
            setLoading(false);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!sessionStorage.getItem('isAdmin')) {
            router.push('/');
            return;
        }

        fetch('/api/auth/check')
            .then(res => {
                if (res.status === 401) router.push('/');
                else setAuthLoading(false);
            })
            .catch(() => router.push('/'));
    }, [router]);

    useEffect(() => {
        if (!authLoading) {
            fetchPlans();
        }
    }, [fetchPlans, authLoading]);

    const handleSave = async (plan: Plan) => {
        const method = plan.PlanID ? 'PUT' : 'POST';
        await fetch('/api/plans', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plan)
        });
        fetchPlans();
    };

    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingPlan(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (planId: number) => {
        if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/plans?id=${planId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            fetchPlans();
        } catch (error) {
            console.error(error);
            alert('Failed to delete plan');
        }
    };

    if (authLoading) return null;
    if (loading && plans.length === 0) return <div className={styles.loadingText}>Loading Plans...</div>;
    if (error) return <div className={styles.errorText}>Error: {error}</div>;

    return (
        <main className="dashboard">
            <header className={`header ${styles.pageHeader}`}>
                <div>
                    <h1>Plan <span>Summary</span></h1>
                    <p>Browse all available plans and add-ons</p>
                    <Link href="/" className={styles.backLink}>
                        &larr; Back to Dashboard
                    </Link>
                </div>
                <button onClick={handleAddNew} className={styles.addButton}>
                    + Add Plan
                </button>
            </header>

            <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {plans.map((plan) => (
                    <div
                        key={plan.PlanID}
                        className={`card ${styles.planCard} ${plan.PlanType === 'Postpaid' ? styles.planCardPostpaid : styles.planCardPrepaid}`}
                    >
                        <div className={styles.cardActions}>
                            <button onClick={() => handleEdit(plan)} className={styles.editButton}>
                                Edit
                            </button>
                            <button onClick={() => plan.PlanID && handleDelete(plan.PlanID)} className={styles.deleteButton}>
                                Delete
                            </button>
                        </div>

                        <div className={styles.cardHeader}>
                            <h3 className={styles.planName}>{plan.PlanName}</h3>
                        </div>

                        <span className={`${styles.planTypeBadge} ${plan.PlanType === 'Postpaid' ? styles.badgePostpaid : styles.badgePrepaid}`}>
                            {plan.PlanType}
                        </span>

                        <p className={styles.planDescription}>{plan.Description}</p>

                        <div className={styles.dataSection}>
                            <div className={styles.dataLabel}>Data Limit</div>
                            <div className={styles.dataValue}>{plan.DataLimit} GB</div>
                        </div>
                    </div>
                ))}
            </section>

            {plans.length === 0 && !loading && (
                <div className="card">
                    <p className={styles.emptyMessage}>No plans available.</p>
                </div>
            )}

            <PlanModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                plan={editingPlan}
            />
        </main>
    );
}
