"use client";

import { useState, useEffect } from 'react';
import styles from './PlanModal.module.css';

type Plan = {
    PlanID?: number;
    PlanName: string;
    DataLimit: number;
    Description: string;
    PlanType: string;
};

interface PlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (plan: Plan) => Promise<void>;
    plan?: Plan | null;
}

export default function PlanModal({ isOpen, onClose, onSave, plan }: PlanModalProps) {
    const [formData, setFormData] = useState<Plan>({
        PlanName: '',
        DataLimit: 0,
        Description: '',
        PlanType: 'Postpaid'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (plan) {
            setFormData(plan);
        } else {
            setFormData({
                PlanName: '',
                DataLimit: 0,
                Description: '',
                PlanType: 'Postpaid'
            });
        }
    }, [plan, isOpen]);

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
                    {plan ? 'Edit Plan' : 'Add New Plan'}
                </h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <label>
                        <span className={styles.labelText}>Plan Name</span>
                        <input
                            type="text"
                            required
                            value={formData.PlanName}
                            onChange={e => setFormData({ ...formData, PlanName: e.target.value })}
                            className={styles.input}
                        />
                    </label>
                    <label>
                        <span className={styles.labelText}>Data Limit (GB)</span>
                        <input
                            type="number"
                            required
                            min="1"
                            value={formData.DataLimit}
                            onChange={e => setFormData({ ...formData, DataLimit: parseInt(e.target.value) || 0 })}
                            className={styles.input}
                        />
                    </label>
                    <label>
                        <span className={styles.labelText}>Plan Type</span>
                        <select
                            value={formData.PlanType}
                            onChange={e => setFormData({ ...formData, PlanType: e.target.value })}
                            className={styles.input}
                        >
                            <option value="Postpaid">Postpaid</option>
                            <option value="Prepaid">Prepaid</option>
                        </select>
                    </label>
                    <label>
                        <span className={styles.labelText}>Description</span>
                        <textarea
                            required
                            value={formData.Description}
                            onChange={e => setFormData({ ...formData, Description: e.target.value })}
                            className={styles.textarea}
                        />
                    </label>

                    <div className={styles.buttonContainer}>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className={styles.saveButton}>
                            {loading ? 'Saving...' : 'Save Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
