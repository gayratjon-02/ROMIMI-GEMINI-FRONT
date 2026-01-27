'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Check } from 'lucide-react';
import styles from '@/scss/styles/HomePage/HomeMiddle.module.scss';

export interface ProductAnalysis {
    type: string;
    color: string;
    material: string;
    details: string;
    logo_front: string;
    logo_back: string;
}

interface ProductStep2Props {
    analysis: ProductAnalysis;
    onAnalysisChange: (field: keyof ProductAnalysis, value: string) => void;
    onBack: () => void;
    onNext: () => void;
    frontImagePreview?: string;
}

const ProductStep2_Analysis: React.FC<ProductStep2Props> = ({
    analysis,
    onAnalysisChange,
    onBack,
    onNext,
    frontImagePreview,
}) => {
    const fields: { key: keyof ProductAnalysis; label: string; placeholder: string }[] = [
        { key: 'type', label: 'Product Type', placeholder: 'e.g., Zip Tracksuit Set' },
        { key: 'color', label: 'Primary Color', placeholder: 'e.g., Forest Green' },
        { key: 'material', label: 'Material', placeholder: 'e.g., Velour, Cotton' },
        { key: 'details', label: 'Details & Accents', placeholder: 'e.g., White piping, gold zipper' },
        { key: 'logo_front', label: 'Front Logo Position', placeholder: 'e.g., Chest embroidery' },
        { key: 'logo_back', label: 'Back Logo Position', placeholder: 'e.g., Center print' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header with AI Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    background: 'var(--wizard-accent-light)',
                    borderRadius: 8,
                    color: 'var(--wizard-accent)',
                    fontSize: 13,
                    fontWeight: 600,
                }}>
                    <Sparkles size={16} />
                    AI Analysis Complete
                </div>
                <p style={{ color: 'var(--wizard-text-secondary)', fontSize: 14, margin: 0 }}>
                    Review and edit the detected product details
                </p>
            </div>

            {/* Preview + Form Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32, marginBottom: 32 }}>
                {/* Image Preview */}
                {frontImagePreview && (
                    <div style={{
                        background: 'var(--wizard-surface)',
                        borderRadius: 16,
                        overflow: 'hidden',
                        border: '1px solid var(--wizard-border)',
                    }}>
                        <img
                            src={frontImagePreview}
                            alt="Product preview"
                            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
                        />
                        <div style={{ padding: 16 }}>
                            <p style={{
                                fontSize: 12,
                                color: 'var(--wizard-text-muted)',
                                margin: 0,
                                textAlign: 'center',
                            }}>
                                Analyzed Product
                            </p>
                        </div>
                    </div>
                )}

                {/* Analysis Form */}
                <div className={styles.analysisForm}>
                    {fields.map((field) => (
                        <div key={field.key} className={styles.formGroup}>
                            <label className={styles.formLabel}>{field.label}</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                value={analysis[field.key]}
                                onChange={(e) => onAnalysisChange(field.key, e.target.value)}
                                placeholder={field.placeholder}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Validation Summary */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                padding: 16,
                background: 'var(--wizard-surface)',
                borderRadius: 12,
                marginBottom: 32,
            }}>
                {Object.entries(analysis).map(([key, value]) => (
                    <div
                        key={key}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            background: value ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            borderRadius: 6,
                            fontSize: 12,
                            color: value ? 'var(--wizard-success)' : 'var(--wizard-error)',
                        }}
                    >
                        <Check size={14} />
                        {key.replace('_', ' ')}
                    </div>
                ))}
            </div>

            {/* Action Bar */}
            <div className={styles.actionBar}>
                <button className={styles.btnSecondary} onClick={onBack}>
                    <ArrowLeft size={18} />
                    Back
                </button>
                <button className={styles.btnPrimary} onClick={onNext}>
                    Continue to Preview
                    <ArrowRight size={18} />
                </button>
            </div>
        </motion.div>
    );
};

export default ProductStep2_Analysis;
