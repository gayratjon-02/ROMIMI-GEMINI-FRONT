'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Check, AlertCircle } from 'lucide-react';
import styles from '@/scss/styles/HomePage/HomeMiddle.module.scss';

export interface ProductAnalysis {
    type: string;
    color: string;
    color_hex: string;
    texture: string;
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
        { key: 'color_hex', label: 'Color Hex Code', placeholder: 'e.g., #2D5016' },
        { key: 'texture', label: 'Texture Description', placeholder: 'e.g., Heavyweight fleece with matte finish' },
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
            <div className={styles.analysisLayout}>
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
                            {field.key === 'color_hex' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 8,
                                            border: '2px solid var(--wizard-border)',
                                            backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(analysis.color_hex) ? analysis.color_hex : '#000000',
                                            flexShrink: 0,
                                        }}
                                        title={`Preview: ${analysis.color_hex}`}
                                    />
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={analysis[field.key]}
                                        onChange={(e) => onAnalysisChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        style={{ flex: 1 }}
                                    />
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    value={analysis[field.key]}
                                    onChange={(e) => onAnalysisChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                />
                            )}
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
                {Object.entries(analysis).map(([key, value]) => {
                    const isUnknown = value?.toLowerCase().includes('unknown');
                    const isValid = value && !isUnknown;

                    return (
                        <div
                            key={key}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                background: isValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                borderRadius: 6,
                                fontSize: 12,
                                color: isValid ? 'var(--wizard-success)' : 'var(--wizard-error)',
                                border: `1px solid ${isValid ? 'transparent' : 'rgba(239, 68, 68, 0.2)'}`
                            }}
                        >
                            {isValid ? <Check size={14} /> : <AlertCircle size={14} />}
                            {key.replace('_', ' ')}
                        </div>
                    );
                })}
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
