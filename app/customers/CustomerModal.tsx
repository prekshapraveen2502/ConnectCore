"use client";

import { useState, useEffect } from 'react';
import styles from './CustomerModal.module.css';

type Customer = {
    CustomerID?: number;
    CustomerName: string;
    PhoneNumber: string;
    Email?: string;
    DOB: string;
    Status: 'Active' | 'Inactive';
};

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (customer: Customer) => Promise<void>;
    customer?: Customer | null;
}

export default function CustomerModal({ isOpen, onClose, onSave, customer }: CustomerModalProps) {
    const [formData, setFormData] = useState<Customer>({
        CustomerName: '',
        PhoneNumber: '',
        Email: '',
        DOB: '',
        Status: 'Active'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (customer) {
            setFormData({
                ...customer,
                DOB: customer.DOB ? new Date(customer.DOB).toISOString().split('T')[0] : ''
            });
        } else {
            setFormData({
                CustomerName: '',
                PhoneNumber: '',
                Email: '',
                DOB: '',
                Status: 'Active'
            });
        }
    }, [customer, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSave(formData);
        setLoading(false);
        onClose();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2 className={styles.title}>
                    {customer ? 'Edit Customer' : 'Add New Customer'}
                </h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <label>
                        <span className={styles.labelText}>Name</span>
                        <input
                            type="text"
                            required
                            value={formData.CustomerName}
                            onChange={e => setFormData({ ...formData, CustomerName: e.target.value })}
                            className={styles.input}
                        />
                    </label>
                    <label>
                        <span className={styles.labelText}>Phone Number</span>
                        <input
                            type="text"
                            required
                            value={formData.PhoneNumber}
                            onChange={e => setFormData({ ...formData, PhoneNumber: e.target.value })}
                            className={styles.input}
                        />
                    </label>
                    <label>
                        <span className={styles.labelText}>Email</span>
                        <input
                            type="email"
                            value={formData.Email || ''}
                            onChange={e => setFormData({ ...formData, Email: e.target.value })}
                            placeholder="customer@example.com"
                            className={styles.input}
                        />
                    </label>
                    <label>
                        <span className={styles.labelText}>Date of Birth</span>
                        <input
                            type="date"
                            required
                            value={formData.DOB}
                            onChange={e => setFormData({ ...formData, DOB: e.target.value })}
                            className={styles.input}
                        />
                    </label>
                    <label>
                        <span className={styles.labelText}>Status</span>
                        <select
                            value={formData.Status}
                            onChange={e => setFormData({ ...formData, Status: e.target.value as 'Active' | 'Inactive' })}
                            className={styles.input}
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </label>

                    <div className={styles.buttonContainer}>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className={styles.saveButton}>
                            {loading ? 'Saving...' : 'Save Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
