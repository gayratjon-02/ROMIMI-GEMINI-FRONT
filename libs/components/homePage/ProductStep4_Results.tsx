'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, Check, X, Loader2, Home, Eye } from 'lucide-react';
import styles from '@/scss/styles/HomePage/ProductStep4Results.module.scss';

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
    duo: 'Duo Shot',
    solo: 'Solo Shot',
    flatlay_front: 'Flatlay Front',
    flatlay_back: 'Flatlay Back',
    closeup_front: 'Detail Front',
    closeup_back: 'Detail Back',
};

const ProductStep4_Results: React.FC<ProductStep4Props> = ({
    visuals,
    progress,
    isComplete,
    onRetry,
    onDownload,
    onStartNew,
}) => {
    const [fullscreenImage, setFullscreenImage] = useState<VisualOutput | null>(null);

    const completedCount = visuals.filter(v => v.status === 'completed').length;
    const failedCount = visuals.filter(v => v.status === 'failed').length;

    const downloadSingleImage = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(url, '_blank');
        }
    };

    return (
        <div className={styles.container}>
            {/* Header with Progress */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <h2 className={styles.title}>Generated Visuals</h2>
                    <div className={styles.stats}>
                        <span className={styles.statItem}>
                            {isComplete ? (
                                <Check size={16} className={styles.iconSuccess} />
                            ) : (
                                <Loader2 size={16} className={styles.iconSpinning} />
                            )}
                            {completedCount} / {visuals.length} Complete
                        </span>
                        {failedCount > 0 && (
                            <span className={`${styles.statItem} ${styles.error}`}>
                                <X size={16} />
                                {failedCount} Failed
                            </span>
                        )}
                    </div>
                </div>

                <div className={styles.progressBar}>
                    <motion.div
                        className={styles.progressFill}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Results Grid - 3 columns */}
            <div className={styles.resultsGrid}>
                {visuals.map((visual, index) => (
                    <motion.div
                        key={index}
                        className={styles.resultCard}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.08, duration: 0.3 }}
                    >
                        {/* Image Container */}
                        <div className={styles.imageContainer}>
                            {visual.status === 'completed' && visual.image_url ? (
                                <>
                                    <img
                                        src={visual.image_url}
                                        alt={visualTypeLabels[visual.type] || visual.type}
                                        className={styles.resultImage}
                                    />
                                    <div className={styles.imageOverlay}>
                                        <button
                                            className={styles.viewButton}
                                            onClick={() => setFullscreenImage(visual)}
                                        >
                                            <Eye size={20} />
                                            View Full
                                        </button>
                                        <button
                                            className={styles.downloadButton}
                                            onClick={() => visual.image_url && downloadSingleImage(visual.image_url, `romimi-${visual.type}.png`)}
                                        >
                                            <Download size={18} />
                                        </button>
                                    </div>
                                </>
                            ) : visual.status === 'failed' ? (
                                <div className={styles.imagePlaceholder}>
                                    <X size={40} className={styles.failedIcon} />
                                    <p className={styles.errorText}>Failed to generate</p>
                                    <button
                                        onClick={() => onRetry(index)}
                                        className={styles.retryButton}
                                    >
                                        <RefreshCw size={14} />
                                        Retry
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.imagePlaceholder}>
                                    {visual.status === 'processing' ? (
                                        <>
                                            <Loader2 size={40} className={styles.processingIcon} />
                                            <p className={styles.loadingText}>Generating...</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className={styles.pendingIcon} />
                                            <p className={styles.loadingText}>Queued</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Card Footer */}
                        <div className={styles.cardFooter}>
                            <div className={styles.cardInfo}>
                                <h4 className={styles.cardTitle}>
                                    {visualTypeLabels[visual.type] || visual.type}
                                </h4>
                                <span className={`${styles.statusBadge} ${styles[visual.status]}`}>
                                    {visual.status === 'completed' && <Check size={12} />}
                                    {visual.status === 'processing' && <Loader2 size={12} className={styles.spinning} />}
                                    {visual.status === 'failed' && <X size={12} />}
                                    {visual.status.charAt(0).toUpperCase() + visual.status.slice(1)}
                                </span>
                            </div>
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
                    className={styles.btnPrimary}
                    onClick={onDownload}
                    disabled={!isComplete || completedCount === 0}
                >
                    <Download size={18} />
                    Download All ({completedCount})
                </button>
            </div>
            <AnimatePresence>
                {fullscreenImage && (
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setFullscreenImage(null)}
                    >
                        <motion.div
                            className={styles.modalContent}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className={styles.closeButton} onClick={() => setFullscreenImage(null)}>
                                <X size={24} />
                            </button>
                            {fullscreenImage.image_url && (
                                <img
                                    src={fullscreenImage.image_url}
                                    alt={visualTypeLabels[fullscreenImage.type] || fullscreenImage.type}
                                    className={styles.modalImage}
                                />
                            )}
                            <button
                                className={styles.modalDownloadBtn}
                                onClick={() => fullscreenImage.image_url && downloadSingleImage(fullscreenImage.image_url, `romimi-${fullscreenImage.type}.png`)}
                            >
                                <Download size={16} />
                                Download Image
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductStep4_Results;
