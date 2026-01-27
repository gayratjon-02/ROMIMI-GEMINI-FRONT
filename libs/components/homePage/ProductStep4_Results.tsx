'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, Check, X, Loader2, ArrowLeft, Home } from 'lucide-react';
import styles from '@/scss/styles/HomePage/HomeMiddle.module.scss';

interface VisualOutput {
    type: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    image_url?: string;
    error?: string;
}

interface ProductStep4Props {
    visuals: VisualOutput[];
    progress: number;
    isComplete: boolean;
    onRetry: (index: number) => void;
    onDownload: () => void;
    onStartNew: () => void;
}

const visualTypeLabels: Record<string, string> = {
    main_visual: 'Hero Shot',
    lifestyle: 'Lifestyle',
    detail_front: 'Front Detail',
    detail_back: 'Back Detail',
    model_pose_1: 'Model Pose 1',
    model_pose_2: 'Model Pose 2',
};

const ProductStep4_Results: React.FC<ProductStep4Props> = ({
    visuals,
    progress,
    isComplete,
    onRetry,
    onDownload,
    onStartNew,
}) => {
    const completedCount = visuals.filter(v => v.status === 'completed').length;
    const failedCount = visuals.filter(v => v.status === 'failed').length;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            {/* Progress Section */}
            <div style={{ marginBottom: 32 }}>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className={styles.progressText}>
                    {isComplete ? (
                        <>
                            <Check size={16} style={{ color: 'var(--wizard-success)', marginRight: 8 }} />
                            Generation complete! {completedCount} of {visuals.length} visuals ready.
                            {failedCount > 0 && ` (${failedCount} failed)`}
                        </>
                    ) : (
                        <>
                            <Loader2 size={16} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
                            Generating visuals... {completedCount} of {visuals.length}
                        </>
                    )}
                </p>
            </div>

            {/* Results Grid */}
            <div className={styles.resultsGrid}>
                {visuals.map((visual, index) => (
                    <motion.div
                        key={index}
                        className={styles.resultCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        {visual.status === 'completed' && visual.image_url ? (
                            <img
                                src={visual.image_url}
                                alt={visual.type}
                                className={styles.resultImage}
                            />
                        ) : visual.status === 'failed' ? (
                            <div className={styles.resultLoading} style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                                <X size={32} style={{ color: 'var(--wizard-error)' }} />
                                <p style={{ color: 'var(--wizard-error)', fontSize: 12, margin: 0 }}>
                                    Generation failed
                                </p>
                                <button
                                    onClick={() => onRetry(index)}
                                    style={{
                                        padding: '6px 12px',
                                        background: 'var(--wizard-error)',
                                        border: 'none',
                                        borderRadius: 6,
                                        color: '#fff',
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}
                                >
                                    <RefreshCw size={12} />
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <div className={styles.resultLoading}>
                                {visual.status === 'processing' ? (
                                    <Loader2 size={32} style={{ color: 'var(--wizard-accent)', animation: 'spin 1s linear infinite' }} />
                                ) : (
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: 'var(--wizard-surface)',
                                        border: '2px solid var(--wizard-border)',
                                    }} />
                                )}
                                <p style={{ color: 'var(--wizard-text-muted)', fontSize: 12, margin: 0 }}>
                                    {visual.status === 'processing' ? 'Generating...' : 'Queued'}
                                </p>
                            </div>
                        )}
                        <div className={styles.resultInfo}>
                            <p className={styles.resultType}>
                                {visualTypeLabels[visual.type] || visual.type}
                            </p>
                            <p className={`${styles.resultStatus} ${styles[visual.status]}`}>
                                {visual.status === 'completed' && <Check size={12} />}
                                {visual.status === 'processing' && <Loader2 size={12} />}
                                {visual.status === 'failed' && <X size={12} />}
                                {visual.status.charAt(0).toUpperCase() + visual.status.slice(1)}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Action Bar */}
            <div className={styles.actionBar}>
                <button className={styles.btnSecondary} onClick={onStartNew}>
                    <Home size={18} />
                    New Product
                </button>
                <button
                    className={styles.btnSuccess}
                    onClick={onDownload}
                    disabled={!isComplete || completedCount === 0}
                >
                    <Download size={18} />
                    Download All ({completedCount})
                </button>
            </div>
        </motion.div>
    );
};

export default ProductStep4_Results;
