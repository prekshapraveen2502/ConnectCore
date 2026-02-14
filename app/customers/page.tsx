"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../globals.css';
import CustomerModal from './CustomerModal';
import styles from './page.module.css';

type Customer = {
    CustomerID?: number;
    CustomerName: string;
    PhoneNumber: string;
    Email?: string;
    DOB: string;
    Age?: number;
    Status: 'Active' | 'Inactive';
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const [authLoading, setAuthLoading] = useState(true);
    const router = useRouter();

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter !== 'All') params.append('status', statusFilter);

            const res = await fetch(`/api/customers?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setCustomers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

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
            fetchCustomers();
        }
    }, [fetchCustomers, authLoading]);

    const handleSave = async (customer: Customer) => {
        const method = customer.CustomerID ? 'PUT' : 'POST';
        await fetch('/api/customers', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customer)
        });
        fetchCustomers();
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };

    const toggleStatus = async (customer: Customer) => {
        const newStatus = customer.Status === 'Active' ? 'Inactive' : 'Active';
        await handleSave({ ...customer, Status: newStatus });
    };

    if (authLoading) return null;

    return (
        <main className="dashboard">
            <header className={`header ${styles.pageHeader}`}>
                <div>
                    <h1>Customer <span>Management</span></h1>
                    <p>View and manage your telecom user base</p>
                    <Link href="/" className={styles.backLink}>
                        &larr; Back to Dashboard
                    </Link>
                </div>
                <button onClick={handleAddNew} className={styles.addButton}>
                    + Add Customer
                </button>
            </header>

            <div className={styles.filterContainer}>
                <input
                    type="text"
                    placeholder="Search by Name or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.searchInput}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={styles.statusSelect}
                >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>

            <section className="stats-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="card">
                    {loading ? (
                        <p className={styles.loadingText}>Loading...</p>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr className={styles.tableHeaderRow}>
                                    <th className={styles.tableCell}>ID</th>
                                    <th className={styles.tableCell}>Name</th>
                                    <th className={styles.tableCell}>Email</th>
                                    <th className={styles.tableCell}>DOB/Age</th>
                                    <th className={styles.tableCell}>Status</th>
                                    <th className={styles.tableCellRight}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((cust) => (
                                    <tr key={cust.CustomerID} className={styles.tableRow}>
                                        <td className={styles.tableCell}>{cust.CustomerID}</td>
                                        <td className={styles.tableCell}>
                                            <span className={styles.customerName}>{cust.CustomerName}</span>
                                            <div className={styles.customerPhone}>{cust.PhoneNumber}</div>
                                        </td>
                                        <td className={styles.tableCell}>
                                            {cust.Email || <span className={styles.ageText}>—</span>}
                                        </td>
                                        <td className={styles.tableCell}>
                                            {new Date(cust.DOB).toLocaleDateString()}
                                            <span className={styles.ageText}>({cust.Age} yrs)</span>
                                        </td>
                                        <td className={styles.tableCell}>
                                            <span className={`${styles.statusBadge} ${cust.Status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                                                {cust.Status}
                                            </span>
                                        </td>
                                        <td className={styles.actionsCell}>
                                            <button onClick={() => handleEdit(cust)} className={styles.editButton}>
                                                Edit
                                            </button>
                                            <button onClick={() => toggleStatus(cust)} className={styles.toggleButton}>
                                                {cust.Status === 'Active' ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {!loading && customers.length === 0 && (
                        <p className={styles.emptyMessage}>
                            No customers found matching your criteria.
                        </p>
                    )}
                </div>
            </section>

            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                customer={editingCustomer}
            />
        </main>
    );
}
