'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Wand2, Eye, Edit3 } from 'lucide-react';
import styles from '@/scss/styles/HomePage/HomeMiddle.module.scss';
import { ProductAnalysis } from './ProductStep2_Analysis';

interface MergedPrompts {
    main_visual: string;
    lifestyle: string;
    detail_shots: string;
    model_poses: string;
}

interface DAAnalysis {
    background: string;
    lighting: string;
    composition: string;
    props_decor: string;
    mood: string;
}

interface ProductStep3Props {
    productAnalysis: ProductAnalysis;
    daAnalysis: DAAnalysis;
    mergedPrompts: MergedPrompts;
    onPromptsChange: (key: keyof MergedPrompts, value: string) => void;
    onBack: () => void;
    onGenerate: () => void;
    isGenerating: boolean;
}

const ProductStep3_MergePreview: React.FC<ProductStep3Props> = ({
    productAnalysis,
    daAnalysis,
    mergedPrompts,
    onPromptsChange,
    onBack,
    onGenerate,
    isGenerating,
}) => {
    const [editMode, setEditMode] = React.useState<keyof MergedPrompts | null>(null);

    const promptCards = [
        { key: 'main_visual' as const, label: 'Main Visual', icon: <Eye size={16} /> },
        { key: 'lifestyle' as const, label: 'Lifestyle Shot', icon: <Sparkles size={16} /> },
        { key: 'detail_shots' as const, label: 'Detail Shots', icon: <Eye size={16} /> },
        { key: 'model_poses' as const, label: 'Model Poses', icon: <Wand2 size={16} /> },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 8,
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 16px',
                        background: 'linear-gradient(135deg, var(--wizard-accent), #8b5cf6)',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 600,
                    }}>
                        <Wand2 size={16} />
                        Prompt Merge Complete
                    </div>
                </div>
                <p style={{ color: 'var(--wizard-text-secondary)', fontSize: 14, margin: 0 }}>
                    Product + DA style merged. Click on any prompt to edit before generating.
                </p>
            </div>

            {/* Merge Preview Grid */}
            <div className={styles.mergePreview}>
                {/* Left: Source Data */}
                <div className={styles.previewCard}>
                    <h4 className={styles.previewCardTitle}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--wizard-accent)' }} />
                        Source Data
                    </h4>

                    <div className={styles.promptBox}>
                        <p className={styles.promptLabel}>Product</p>
                        <p className={styles.promptText}>
                            {productAnalysis.type} in {productAnalysis.color}, {productAnalysis.material}.
                            {productAnalysis.details}. Front: {productAnalysis.logo_front}. Back: {productAnalysis.logo_back}.
                        </p>
                    </div>

                    <div className={styles.promptBox}>
                        <p className={styles.promptLabel}>DA Style</p>
                        <p className={styles.promptText}>
                            {daAnalysis.background}. {daAnalysis.lighting}. {daAnalysis.composition}.
                            {daAnalysis.props_decor}. Mood: {daAnalysis.mood}.
                        </p>
                    </div>
                </div>

                {/* Right: Generated Prompts */}
                <div className={styles.previewCard}>
                    <h4 className={styles.previewCardTitle}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--wizard-success)' }} />
                        Generated Prompts
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--wizard-text-muted)', fontWeight: 400 }}>
                            Click to edit
                        </span>
                    </h4>

                    {promptCards.map(({ key, label, icon }) => (
                        <div key={key} className={styles.promptBox} style={{ cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <p className={styles.promptLabel} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {icon} {label}
                                </p>
                                <Edit3
                                    size={14}
                                    style={{ color: 'var(--wizard-text-muted)' }}
                                    onClick={() => setEditMode(editMode === key ? null : key)}
                                />
                            </div>
                            {editMode === key ? (
                                <textarea
                                    className={styles.promptTextarea}
                                    value={mergedPrompts[key]}
                                    onChange={(e) => onPromptsChange(key, e.target.value)}
                                    autoFocus
                                    onBlur={() => setEditMode(null)}
                                />
                            ) : (
                                <p
                                    className={styles.promptText}
                                    onClick={() => setEditMode(key)}
                                >
                                    {mergedPrompts[key]}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Bar */}
            <div className={styles.actionBar}>
                <button className={styles.btnSecondary} onClick={onBack} disabled={isGenerating}>
                    <ArrowLeft size={18} />
                    Back to Analysis
                </button>
                <button
                    className={styles.btnSuccess}
                    onClick={onGenerate}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <span className={styles.loadingSpinner} style={{ width: 18, height: 18 }} />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Wand2 size={18} />
                            Generate Visuals
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
};

export default ProductStep3_MergePreview;
