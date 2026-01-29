'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Image as ImageIcon,
    Loader2,
    RefreshCw,
    Download,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    Plus,
    ZoomIn,
} from 'lucide-react';
import styles from '@/scss/styles/HomePage/HomeMiddle.module.scss';
import { createProduct, analyzeProduct } from '@/libs/server/HomePage/product';
import { AnalyzedProductJSON } from '@/libs/types/homepage/product';
import { Brand } from '@/libs/types/homepage/brand';
import {
    startGeneration,
    pollGenerationStatus,
    retryFailedVisual,
    triggerDownload,
} from '@/libs/server/HomePage/generate';
import {
    createGeneration,
    updateMergedPrompts as updatePromptsAPI,
    mergePrompts,
} from '@/libs/server/HomePage/merging';
import { updateDAJSON, getCollection } from '@/libs/server/HomePage/collection';

interface HomeMiddleProps {
    isDarkMode?: boolean;
    selectedCollection?: { id: string; name: string } | null;
    selectedBrand?: Brand | null;
    // NEW: Props from parent for single-page layout
    frontImage?: File | null;
    backImage?: File | null;
    productJSON?: ProductJSON | null;
    fullAnalysisResponse?: any; // Full backend response for display
    productId?: string | null; // Product ID for editing
    daJSON?: DAJSON | null;
    mergedPrompts?: Record<string, string>;
    selectedShots?: string[];
    ageMode?: 'adult' | 'kid';
    isAnalyzing?: boolean;
    onProductAnalyzed?: (json: ProductJSON, productId: string) => void;
    onGenerationIdCreated?: (id: string) => void;
    onAnalysisUpdate?: (updatedResponse: any) => void; // Callback for JSON updates
}

export interface ProductJSON {
    type: string;
    color: string;
    color_hex: string;
    texture: string;
    material: string;
    details: string;
    logo_front: string;
    logo_back: string;
}

export interface DAJSON {
    background: {
        color_hex: string;
        color_name: string;
        description: string;
        texture?: string;
    };
    props: {
        items: string[];
        placement: string;
        style: string;
    };
    mood: string;
    lighting: {
        type: string;
        temperature: string;
        direction: string;
        intensity: string;
    };
    composition: {
        layout: string;
        poses: string;
        framing: string;
    };
    styling?: {
        bottom?: string;
        feet?: string;
    };
    camera: {
        focal_length_mm: number;
        aperture: number;
        focus: string;
    };
    quality: string;
}

interface VisualOutput {
    type: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    image_url?: string;
    error?: string;
}

// Empty state for no visuals
const EmptyState: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => (
    <motion.div
        className={styles.emptyState}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <div className={styles.emptyIcon}>
            <Sparkles size={48} />
        </div>
        <h2>Ready to Generate</h2>
        <p>
            Upload product images in the sidebar, select a DA preset,
            choose your shot types below, and click Generate.
        </p>
        <div className={styles.emptySteps}>
            <div className={styles.emptyStep}>
                <span className={styles.stepNumber}>1</span>
                <span>Upload Product</span>
            </div>
            <div className={styles.emptyStep}>
                <span className={styles.stepNumber}>2</span>
                <span>Select DA</span>
            </div>
            <div className={styles.emptyStep}>
                <span className={styles.stepNumber}>3</span>
                <span>Generate</span>
            </div>
        </div>
    </motion.div>
);

// Analyzed State - Show JSON result after analysis
interface AnalyzedStateProps {
    isDarkMode: boolean;
    productJSON: ProductJSON;
    fullAnalysisResponse?: any;
    daJSON?: DAJSON | null;
    productId?: string;
    onAnalysisUpdate?: (updatedResponse: any) => void;
}

const AnalyzedState: React.FC<AnalyzedStateProps> = ({
    isDarkMode,
    productJSON,
    fullAnalysisResponse,
    daJSON,
    productId,
    onAnalysisUpdate
}) => {
    const [activeTab, setActiveTab] = useState<'full' | 'analysis' | 'da'>('analysis');
    const [isEditing, setIsEditing] = useState(false);
    const [editedJson, setEditedJson] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Format JSON for display
    const formatJSON = (obj: any) => JSON.stringify(obj, null, 2);

    // Full response to display
    const displayResponse = fullAnalysisResponse || {
        success: true,
        product_id: productId || 'N/A',
        name: productJSON.type,
        category: productJSON.type,
        analysis: productJSON,
    };

    // Get current JSON for editing based on active tab
    const getCurrentJson = () => {
        if (activeTab === 'analysis') {
            return displayResponse.analysis;
        } else if (activeTab === 'da' && daJSON) {
            return daJSON;
        }
        return displayResponse;
    };

    // Start editing
    const handleEdit = () => {
        setEditedJson(formatJSON(getCurrentJson()));
        setIsEditing(true);
        setSaveError(null);
        setSaveSuccess(false);
    };

    // Cancel editing
    const handleCancel = () => {
        setIsEditing(false);
        setEditedJson('');
        setSaveError(null);
    };

    // Save changes
    const handleSave = async () => {
        if (!productId) {
            setSaveError('Product ID not available');
            return;
        }

        try {
            // Validate JSON
            const parsedJson = JSON.parse(editedJson);

            setIsSaving(true);
            setSaveError(null);

            // Import and call API
            const { updateProductJsonNew } = await import('@/libs/server/HomePage/product');
            const response = await updateProductJsonNew(productId, parsedJson);

            console.log('✅ Product JSON updated:', response);

            // Update parent state
            if (onAnalysisUpdate && response.final_product_json) {
                onAnalysisUpdate({
                    ...fullAnalysisResponse,
                    analysis: response.final_product_json,
                });
            }

            setSaveSuccess(true);
            setIsEditing(false);

            // Clear success message after 3 seconds
            setTimeout(() => setSaveSuccess(false), 3000);

        } catch (error: any) {
            console.error('Save failed:', error);
            if (error instanceof SyntaxError) {
                setSaveError('Invalid JSON format. Please check your syntax.');
            } else {
                setSaveError(error?.messages?.join(', ') || error?.message || 'Failed to save');
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Reset to original
    const handleReset = async () => {
        if (!productId) {
            setSaveError('Product ID not available');
            return;
        }

        try {
            setIsSaving(true);
            setSaveError(null);

            const { resetProductJson } = await import('@/libs/server/HomePage/product');
            const response = await resetProductJson(productId);

            console.log('✅ Product JSON reset:', response);

            // Update parent state
            if (onAnalysisUpdate && response.analyzed_product_json) {
                onAnalysisUpdate({
                    ...fullAnalysisResponse,
                    analysis: response.analyzed_product_json,
                });
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);

        } catch (error: any) {
            console.error('Reset failed:', error);
            setSaveError(error?.messages?.join(', ') || error?.message || 'Failed to reset');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            className={styles.analyzedState}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className={styles.analyzedHeader}>
                <CheckCircle2 size={24} className={styles.successIcon} />
                <h2>Product Analyzed Successfully</h2>
            </div>

            {/* Product Images Preview */}
            <div className={styles.previewContainer}>
                {/* Main/Front Image */}
                {(fullAnalysisResponse?.front_image_url || fullAnalysisResponse?.imageUrl) && (
                    <div className={styles.imageCard}>
                        <div className={styles.imageLabel}>Front</div>
                        <img
                            src={fullAnalysisResponse.front_image_url || fullAnalysisResponse.imageUrl}
                            alt="Front View"
                        />
                    </div>
                )}

                {/* Back Image */}
                {fullAnalysisResponse?.back_image_url && (
                    <div className={styles.imageCard}>
                        <div className={styles.imageLabel}>Back</div>
                        <img
                            src={fullAnalysisResponse.back_image_url}
                            alt="Back View"
                        />
                    </div>
                )}

                {/* Reference Images */}
                {fullAnalysisResponse?.reference_images?.map((url: string, idx: number) => (
                    <div className={styles.imageCard} key={`ref-${idx}`}>
                        <div className={styles.imageLabel}>Ref {idx + 1}</div>
                        <img
                            src={url}
                            alt={`Reference ${idx + 1}`}
                        />
                    </div>
                ))}
            </div>

            {/* Product Info Summary */}
            {fullAnalysisResponse && (
                <div className={styles.productSummary}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Name:</span>
                        <span className={styles.summaryValue}>{fullAnalysisResponse.name}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Category:</span>
                        <span className={styles.summaryValue}>{fullAnalysisResponse.category}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Product ID:</span>
                        <span className={styles.summaryValue}>{fullAnalysisResponse.product_id}</span>
                    </div>
                </div>
            )}

            {/* Tabs and Edit Controls */}
            <div className={styles.jsonControls}>
                <div className={styles.jsonTabs}>
                    <button
                        className={`${styles.jsonTab} ${activeTab === 'full' ? styles.active : ''}`}
                        onClick={() => { setActiveTab('full'); setIsEditing(false); }}
                    >
                        Full Response
                    </button>
                    <button
                        className={`${styles.jsonTab} ${activeTab === 'analysis' ? styles.active : ''}`}
                        onClick={() => { setActiveTab('analysis'); setIsEditing(false); }}
                    >
                        Analysis Details
                    </button>
                    {daJSON && (
                        <button
                            className={`${styles.jsonTab} ${activeTab === 'da' ? styles.active : ''}`}
                            onClick={() => { setActiveTab('da'); setIsEditing(false); }}
                        >
                            DA JSON
                        </button>
                    )}
                </div>

                {/* Edit/Save/Reset Buttons */}
                {activeTab === 'analysis' && productId && (
                    <div className={styles.editControls}>
                        {!isEditing ? (
                            <>
                                <button className={styles.editBtn} onClick={handleEdit}>
                                    <Plus size={14} />
                                    Edit
                                </button>
                                <button className={styles.resetBtn} onClick={handleReset} disabled={isSaving}>
                                    <RefreshCw size={14} className={isSaving ? styles.spin : ''} />
                                    Reset
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className={styles.saveBtn}
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <Loader2 size={14} className={styles.spin} />
                                    ) : (
                                        <CheckCircle2 size={14} />
                                    )}
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button className={styles.cancelBtn} onClick={handleCancel}>
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Error/Success Messages */}
            {saveError && (
                <div className={styles.errorMessage}>
                    <AlertCircle size={16} />
                    {saveError}
                </div>
            )}
            {saveSuccess && (
                <div className={styles.successMessage}>
                    <CheckCircle2 size={16} />
                    Changes saved successfully!
                </div>
            )}

            {/* JSON Display/Editor */}
            <div className={styles.jsonContainer}>
                {isEditing ? (
                    <textarea
                        className={styles.jsonEditor}
                        value={editedJson}
                        onChange={(e) => setEditedJson(e.target.value)}
                        spellCheck={false}
                    />
                ) : (
                    <pre className={styles.jsonContent}>
                        {activeTab === 'full' && formatJSON(displayResponse)}
                        {activeTab === 'analysis' && formatJSON(displayResponse.analysis)}
                        {activeTab === 'da' && daJSON && formatJSON(daJSON)}
                    </pre>
                )}
            </div>

            <div className={styles.nextStepHint}>
                <p>✨ Select a DA Preset and click Generate to create visuals</p>
            </div>
        </motion.div>
    );
};

// Visual Card Component
interface VisualCardProps {
    visual: VisualOutput;
    index: number;
    isDarkMode: boolean;
    onRetry: (index: number) => void;
}

const VisualCard: React.FC<VisualCardProps> = ({ visual, index, isDarkMode, onRetry }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    const getStatusColor = () => {
        switch (visual.status) {
            case 'completed': return '#22c55e';
            case 'failed': return '#ef4444';
            case 'processing': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = () => {
        switch (visual.status) {
            case 'completed': return <CheckCircle2 size={16} />;
            case 'failed': return <AlertCircle size={16} />;
            case 'processing': return <Loader2 size={16} className={styles.spin} />;
            default: return <ImageIcon size={16} />;
        }
    };

    return (
        <>
            <motion.div
                className={`${styles.visualCard} ${styles[visual.status]}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Status Badge */}
                <div className={styles.statusBadge} style={{ background: getStatusColor() }}>
                    {getStatusIcon()}
                    <span>{visual.type.replace(/_/g, ' ')}</span>
                </div>

                {/* Image or Loading State */}
                <div className={styles.visualContent}>
                    {visual.status === 'completed' && visual.image_url ? (
                        <>
                            <img
                                src={visual.image_url}
                                alt={visual.type}
                                className={styles.visualImage}
                            />
                            {isHovered && (
                                <div className={styles.visualOverlay}>
                                    <button
                                        className={styles.zoomBtn}
                                        onClick={() => setIsZoomed(true)}
                                    >
                                        <ZoomIn size={20} />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : visual.status === 'processing' ? (
                        <div className={styles.loadingState}>
                            <Loader2 size={32} className={styles.spin} />
                            <span>Generating...</span>
                        </div>
                    ) : visual.status === 'failed' ? (
                        <div className={styles.errorState}>
                            <AlertCircle size={32} />
                            <span>{visual.error || 'Generation failed'}</span>
                            <button
                                className={styles.retryBtn}
                                onClick={() => onRetry(index)}
                            >
                                <RefreshCw size={14} />
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className={styles.pendingState}>
                            <ImageIcon size={32} />
                            <span>Waiting...</span>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Zoom Modal */}
            <AnimatePresence>
                {isZoomed && visual.image_url && (
                    <motion.div
                        className={styles.zoomModal}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsZoomed(false)}
                    >
                        <motion.img
                            src={visual.image_url}
                            alt={visual.type}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// Progress Bar Component
interface ProgressBarProps {
    progress: number;
    isDarkMode: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, isDarkMode }) => (
    <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
            <motion.div
                className={styles.progressFill}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
            />
        </div>
        <span className={styles.progressText}>{Math.round(progress)}%</span>
    </div>
);

const HomeMiddle: React.FC<HomeMiddleProps> = ({
    isDarkMode = true,
    selectedCollection,
    selectedBrand,
    frontImage,
    backImage,
    productJSON,
    fullAnalysisResponse,
    daJSON,
    mergedPrompts = {},
    selectedShots = [],
    ageMode = 'adult',
    isAnalyzing = false,
    onProductAnalyzed,
    onGenerationIdCreated,
    productId,
    onAnalysisUpdate,
}) => {
    // Visuals State
    const [visuals, setVisuals] = useState<VisualOutput[]>([]);
    const [progress, setProgress] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationId, setGenerationId] = useState<string | null>(null);

    // DA Analysis from collection
    const [collectionDA, setCollectionDA] = useState<DAJSON | null>(null);

    // Fetch DA when collection changes
    useEffect(() => {
        if (!selectedCollection?.id) {
            setCollectionDA(null);
            return;
        }

        (async () => {
            try {
                const collection = await getCollection(selectedCollection.id);
                if (collection.analyzed_da_json) {
                    setCollectionDA(collection.analyzed_da_json as unknown as DAJSON);
                } else {
                    setCollectionDA(null);
                }
            } catch (error) {
                console.warn('Failed to fetch collection DA:', error);
                setCollectionDA(null);
            }
        })();
    }, [selectedCollection?.id]);

    // Use passed DA or fetched DA
    const activeDA = daJSON || collectionDA;

    const handleRetry = useCallback(async (index: number) => {
        if (!generationId) return;

        try {
            setVisuals(prev => prev.map((v, i) =>
                i === index ? { ...v, status: 'processing' } : v
            ));

            await retryFailedVisual(generationId, index);

            const pollRetry = setInterval(async () => {
                try {
                    const status = await pollGenerationStatus(generationId);
                    setVisuals(status.visuals);

                    if (status.visuals[index]?.status === 'completed' ||
                        status.visuals[index]?.status === 'failed') {
                        clearInterval(pollRetry);
                    }
                } catch (error) {
                    clearInterval(pollRetry);
                }
            }, 2000);

            setTimeout(() => clearInterval(pollRetry), 60000);
        } catch (error) {
            console.error('Retry failed:', error);
            setVisuals(prev => prev.map((v, i) =>
                i === index ? { ...v, status: 'failed' } : v
            ));
        }
    }, [generationId]);

    const handleDownloadAll = useCallback(async () => {
        if (!generationId) return;

        try {
            await triggerDownload(generationId, `visuals-${Date.now()}.zip`);
        } catch (error) {
            console.error('Download failed:', error);
        }
    }, [generationId]);

    const isComplete = visuals.length > 0 &&
        visuals.every(v => v.status === 'completed' || v.status === 'failed');

    const completedCount = visuals.filter(v => v.status === 'completed').length;

    return (
        <div className={`${styles.container} ${isDarkMode ? styles.dark : styles.light}`}>
            {/* Header with Progress */}
            {isGenerating && (
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className={styles.headerTitle}>
                        <Sparkles size={20} />
                        <span>Generating Visuals</span>
                    </div>
                    <ProgressBar progress={progress} isDarkMode={isDarkMode} />
                </motion.div>
            )}

            {/* Complete Header */}
            {isComplete && visuals.length > 0 && (
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className={styles.headerTitle}>
                        <CheckCircle2 size={20} color="#22c55e" />
                        <span>Generation Complete</span>
                        <span className={styles.count}>
                            {completedCount}/{visuals.length} completed
                        </span>
                    </div>
                    <button
                        className={styles.downloadBtn}
                        onClick={handleDownloadAll}
                    >
                        <Download size={18} />
                        Download All
                    </button>
                </motion.div>
            )}

            {/* Main Content */}
            <div className={styles.content}>
                {visuals.length === 0 ? (
                    // Show AnalyzedState if product has been analyzed, otherwise show EmptyState
                    productJSON ? (
                        <AnalyzedState
                            isDarkMode={isDarkMode}
                            productJSON={productJSON}
                            fullAnalysisResponse={fullAnalysisResponse}
                            daJSON={daJSON || collectionDA}
                            productId={productId || undefined}
                            onAnalysisUpdate={onAnalysisUpdate}
                        />
                    ) : (
                        <EmptyState isDarkMode={isDarkMode} />
                    )
                ) : (
                    <div className={styles.visualsGrid}>
                        <AnimatePresence>
                            {visuals.map((visual, index) => (
                                <VisualCard
                                    key={`${visual.type}-${index}`}
                                    visual={visual}
                                    index={index}
                                    isDarkMode={isDarkMode}
                                    onRetry={handleRetry}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Analyzing Overlay */}
            <AnimatePresence>
                {isAnalyzing && (
                    <motion.div
                        className={styles.analyzingOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className={styles.analyzingContent}>
                            <Loader2 size={48} className={styles.spin} />
                            <h3>Analyzing Product...</h3>
                            <p>This may take a moment</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HomeMiddle;