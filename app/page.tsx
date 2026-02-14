"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from './LoginModal';
import styles from './page.module.css';

export default function Home() {
    const [stats, setStats] = useState({
        totalCustomers: 0,
        activePlans: 0,
        pendingBills: 0
    });

    const [authLoading, setAuthLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // If a customer is logged in, redirect to customer dashboard
        if (sessionStorage.getItem('customerId')) {
            router.push('/customer-dashboard');
            return;
        }

        if (!sessionStorage.getItem('isAdmin')) {
            setIsAuthenticated(false);
            setAuthLoading(false);
            return;
        }

        fetch('/api/auth/check')
            .then(res => {
                if (res.status === 401) {
                    setIsAuthenticated(false);
                } else {
                    setIsAuthenticated(true);
                }
                setAuthLoading(false);
            })
            .catch(() => {
                setIsAuthenticated(false);
                setAuthLoading(false);
            });
    }, [router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetch('/api/dashboard')
                .then(res => res.json())
                .then(data => {
                    if (data && !data.error) {
                        setStats(data);
                    }
                })
                .catch(console.error);
        }
    }, [isAuthenticated]);

    const menuItems = [
        {
            title: 'Customer Management',
            description: 'View, create, edit, and manage customer accounts',
            icon: '👥',
            href: '/customers',
            color: '#38bdf8'
        },
        {
            title: 'Plan Summary',
            description: 'Browse all available plans and add-ons',
            icon: '📋',
            href: '/plans',
            color: '#8b5cf6'
        },
        {
            title: 'Bill Payment',
            description: 'View unpaid bills and process payments',
            icon: '💳',
            href: '/billing',
            color: '#10b981'
        }
    ];

    const handleLoginSuccess = (loginType: 'admin' | 'customer') => {
        if (loginType === 'customer') {
            router.push('/customer-dashboard');
            return;
        }
        setIsAuthenticated(true);
        fetch('/api/dashboard')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setStats(data);
                }
            })
            .catch(console.error);
    };

    const handleLogout = async () => {
        sessionStorage.removeItem('isAdmin');
        await fetch('/api/logout', { method: 'POST' });
        setIsAuthenticated(false);
        setStats({ totalCustomers: 0, activePlans: 0, pendingBills: 0 });
    };

    if (authLoading) return null;

    return (
        <>
            {!isAuthenticated && <LoginModal onLoginSuccess={handleLoginSuccess} />}

            <main className="dashboard">
                <header className={`header ${styles.dashboardHeader}`}>
                    {/* Left spacer keeps center truly centered */}
                    <div />

                    {/* Centered title */}
                    <div className={styles.headerTitleWrapper}>
                        <h1 className={styles.headerTitle}>
                            Telecom<span> Management</span> Portal
                        </h1>
                        <p className={styles.headerSubtitle}>
                            Manage your telecom operations efficiently
                        </p>
                    </div>

                    {/* Right controls */}
                    <div className={styles.headerControls}>
                        {isAuthenticated && (
                            <button onClick={handleLogout} className={styles.logoutButton}>
                                Logout
                            </button>
                        )}
                    </div>
                </header>

                <div className={`${styles.contentWrapper} ${!isAuthenticated ? styles.blurred : ''}`}>
                    <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                        {menuItems.map((item, index) => (
                            <Link
                                key={index}
                                href={isAuthenticated ? item.href : '#'}
                                className={styles.linkNoDecoration}
                            >
                                <div className={`card ${styles.menuCard} ${!isAuthenticated ? styles.menuCardDisabled : ''}`}>
                                    <div>
                                        <div className={styles.menuIcon}>{item.icon}</div>
                                        <h3 className={styles.menuTitle} style={{ color: item.color }}>
                                            {item.title}
                                        </h3>
                                        <p className={styles.menuDescription}>{item.description}</p>
                                    </div>
                                    <div className={styles.menuLink} style={{ color: item.color }}>
                                        Open →
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </section>

                    <section className={styles.statsSection}>
                        <div className={`card ${styles.statsCard}`}>
                            <h3 className={styles.statsTitle}>Quick Stats</h3>
                            <div className={styles.statsGrid}>
                                <div>
                                    <div className={styles.statValue}>
                                        {isAuthenticated ? stats.totalCustomers : '---'}
                                    </div>
                                    <div className={styles.statLabel}>Total Customers</div>
                                </div>
                                <div>
                                    <div className={styles.statValue}>
                                        {isAuthenticated ? stats.activePlans : '---'}
                                    </div>
                                    <div className={styles.statLabel}>Active Plans</div>
                                </div>
                                <div>
                                    <div className={styles.statValue}>
                                        {isAuthenticated ? stats.pendingBills : '---'}
                                    </div>
                                    <div className={styles.statLabel}>Pending Bills</div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
