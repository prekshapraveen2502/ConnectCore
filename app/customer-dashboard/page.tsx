"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import '../globals.css';
import styles from './page.module.css';

type Tab = 'account' | 'plans' | 'payments';

type Customer = {
    CustomerID: number;
    CustomerName: string;
    PhoneNumber: string;
    DOB: string;
    Status: string;
    StartDate: string;
};

type Plan = {
    PlanID: number;
    PlanName: string;
    DataLimit: number;
    Description: string;
    PlanType: string;
    PlanStartDate?: string;
};

type Bill = {
    BillID: number;
    CustomerID: number;
    Amount: number;
    BillDate: string;
    DueDate: string;
    Status: string;
};

export default function CustomerDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('account');

    const [customerId, setCustomerId] = useState<string | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [allPlans, setAllPlans] = useState<Plan[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);

    const [loading, setLoading] = useState(true);
    const [changingPlan, setChangingPlan] = useState<number | null>(null);
    const [payingBill, setPayingBill] = useState<number | null>(null);
    const [toast, setToast] = useState('');

    // Redirect if not a customer
    useEffect(() => {
        const id = sessionStorage.getItem('customerId');
        if (!id) {
            router.push('/');
            return;
        }
        setCustomerId(id);
    }, [router]);

    // Fetch customer info
    const fetchCustomer = useCallback(async () => {
        if (!customerId) return;
        try {
            const res = await fetch(`/api/customer/${customerId}`);
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setCustomer(data.customer);
            setCurrentPlan(data.currentPlan);
        } catch (err) {
            console.error(err);
        }
    }, [customerId]);

    // Fetch all plans
    const fetchPlans = useCallback(async () => {
        try {
            const res = await fetch('/api/plans');
            if (!res.ok) throw new Error('Failed to load plans');
            const data = await res.json();
            setAllPlans(data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    // Fetch bills
    const fetchBills = useCallback(async () => {
        if (!customerId) return;
        try {
            const res = await fetch(`/api/customer/${customerId}/bills`);
            const data = await res.json();
            setBills(data);
        } catch (err) {
            console.error(err);
        }
    }, [customerId]);

    useEffect(() => {
        if (!customerId) return;
        setLoading(true);
        Promise.all([fetchCustomer(), fetchPlans(), fetchBills()])
            .finally(() => setLoading(false));
    }, [customerId, fetchCustomer, fetchPlans, fetchBills]);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleChangePlan = async (planId: number) => {
        if (!customerId) return;
        setChangingPlan(planId);
        try {
            const res = await fetch(`/api/customer/${customerId}/change-plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId })
            });
            if (res.ok) {
                showToast('Plan updated successfully!');
                await fetchCustomer();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to change plan');
            }
        } catch {
            alert('Something went wrong');
        } finally {
            setChangingPlan(null);
        }
    };

    const handlePayBill = async (billId: number) => {
        if (!customerId) return;
        setPayingBill(billId);
        try {
            const res = await fetch(`/api/customer/${customerId}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ billId })
            });
            if (res.ok) {
                showToast('Payment successful!');
                await fetchBills();
            } else {
                const data = await res.json();
                alert(data.error || 'Payment failed');
            }
        } catch {
            alert('Something went wrong');
        } finally {
            setPayingBill(null);
        }
    };

    const handleLogout = async () => {
        sessionStorage.removeItem('customerId');
        await fetch('/api/logout', { method: 'POST' });
        router.push('/');
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    if (loading || !customer) {
        return <div className={styles.loadingWrapper}>Loading your dashboard...</div>;
    }

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'account', label: 'My Account', icon: '👤' },
        { key: 'plans', label: 'Browse Plans', icon: '📋' },
        { key: 'payments', label: 'Payments', icon: '💳' },
    ];

    return (
        <main className="dashboard">
            <header className={`header ${styles.dashboardHeader}`}>
                <div />
                <div className={styles.headerTitleWrapper}>
                    <h1 className={styles.headerTitle}>
                        My <span>Dashboard</span>
                    </h1>
                    <p className={styles.headerSubtitle}>
                        Welcome back, {customer.CustomerName}
                    </p>
                </div>
                <div className={styles.headerControls}>
                    <button onClick={handleLogout} className={styles.logoutButton}>
                        Logout
                    </button>
                </div>
            </header>

            {/* Tab Navigation */}
            <nav className={styles.tabNav}>
                {tabs.map(t => (
                    <button
                        key={t.key}
                        className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(t.key)}
                    >
                        <span className={styles.tabIcon}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </nav>

            {/* =========== MY ACCOUNT TAB =========== */}
            {activeTab === 'account' && (
                <div className={styles.accountGrid}>
                    {/* Customer Info Card */}
                    <div className={`card ${styles.infoCard}`}>
                        <p className={styles.cardLabel}>Personal Information</p>
                        <h3 className={styles.cardTitle}>{customer.CustomerName}</h3>

                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Customer ID</span>
                            <span className={styles.infoValue}>#{customer.CustomerID}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Phone</span>
                            <span className={styles.infoValue}>{customer.PhoneNumber || '—'}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Date of Birth</span>
                            <span className={styles.infoValue}>{formatDate(customer.DOB)}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Member Since</span>
                            <span className={styles.infoValue}>{formatDate(customer.StartDate)}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Status</span>
                            <span className={`${styles.statusBadge} ${customer.Status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                                {customer.Status}
                            </span>
                        </div>
                    </div>

                    {/* Current Plan Card */}
                    <div className={`card ${styles.planCard}`}>
                        <p className={styles.cardLabel}>Current Plan</p>
                        {currentPlan ? (
                            <>
                                <span className={`${styles.planTypeBadge} ${currentPlan.PlanType === 'Postpaid' ? styles.badgePostpaid : styles.badgePrepaid}`}>
                                    {currentPlan.PlanType}
                                </span>
                                <h3 className={styles.planName}>{currentPlan.PlanName}</h3>
                                <p className={styles.planDesc}>{currentPlan.Description}</p>
                                <div className={styles.dataHighlight}>
                                    <span className={styles.dataNumber}>{currentPlan.DataLimit}</span>
                                    <span className={styles.dataUnit}>GB Data</span>
                                </div>
                            </>
                        ) : (
                            <div className={styles.noPlan}>
                                <div className={styles.noPlanIcon}>📡</div>
                                <p>No plan assigned yet.</p>
                                <p style={{ fontSize: '0.85rem' }}>Browse available plans to get started!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* =========== BROWSE PLANS TAB =========== */}
            {activeTab === 'plans' && (
                <div className={styles.plansGrid}>
                    {allPlans.map(plan => {
                        const isCurrent = currentPlan?.PlanID === plan.PlanID;
                        return (
                            <div
                                key={plan.PlanID}
                                className={`card ${styles.browsePlanCard} ${isCurrent ? styles.currentPlanGlow : ''}`}
                            >
                                {isCurrent && <span className={styles.currentBadge}>Current Plan</span>}
                                <span className={`${styles.planTypeBadge} ${plan.PlanType === 'Postpaid' ? styles.badgePostpaid : styles.badgePrepaid}`}>
                                    {plan.PlanType}
                                </span>
                                <h3 className={styles.browsePlanName}>{plan.PlanName}</h3>
                                <p className={styles.browsePlanDesc}>{plan.Description}</p>
                                <p className={styles.browsePlanData}>
                                    Data: <strong>{plan.DataLimit} GB</strong>
                                </p>
                                {!isCurrent && (
                                    <button
                                        className={styles.upgradeButton}
                                        onClick={() => handleChangePlan(plan.PlanID)}
                                        disabled={changingPlan === plan.PlanID}
                                    >
                                        {changingPlan === plan.PlanID ? 'Switching...' : 'Switch to this Plan'}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {allPlans.length === 0 && (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📋</div>
                            <p className={styles.emptyText}>No plans available at the moment.</p>
                        </div>
                    )}
                </div>
            )}

            {/* =========== PAYMENTS TAB =========== */}
            {activeTab === 'payments' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {bills.length > 0 ? (
                        <table className={styles.billsTable}>
                            <thead>
                                <tr>
                                    <th>Bill #</th>
                                    <th>Amount</th>
                                    <th>Bill Date</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {bills.map(bill => (
                                    <tr key={bill.BillID}>
                                        <td>#{bill.BillID}</td>
                                        <td className={styles.billAmount}>${bill.Amount?.toFixed(2)}</td>
                                        <td>{formatDate(bill.BillDate)}</td>
                                        <td>{formatDate(bill.DueDate)}</td>
                                        <td>
                                            <span className={bill.Status === 'Pending' ? styles.billStatusPending : styles.billStatusPaid}>
                                                {bill.Status}
                                            </span>
                                        </td>
                                        <td>
                                            {bill.Status === 'Pending' && (
                                                <button
                                                    className={styles.payButton}
                                                    onClick={() => handlePayBill(bill.BillID)}
                                                    disabled={payingBill === bill.BillID}
                                                >
                                                    {payingBill === bill.BillID ? 'Paying...' : 'Pay Now'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>✅</div>
                            <p className={styles.emptyText}>No bills found. You&#39;re all caught up!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Toast notification */}
            {toast && <div className={styles.successToast}>{toast}</div>}
        </main>
    );
}
