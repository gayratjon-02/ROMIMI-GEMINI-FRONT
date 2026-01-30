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
    Eye,
    Play,
    Layers,
} from 'lucide-react';
import styles from '@/scss/styles/HomePage/HomeMiddle.module.scss';
import { createProduct, analyzeProduct } from '@/libs/server/HomePage/product';
import { AnalyzedProductJSON } from '@/libs/types/homepage/product';
import { Brand } from '@/libs/types/homepage/brand';
import { Generation } from '@/libs/types/homepage/generation';
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
    onDAUpdate?: (updatedDA: DAJSON) => void; // Callback for DA JSON updates
    generationResponse?: Generation | null; // Response from createGeneration API
    onConfirmGeneration?: () => void;
    onMerge?: (options: any) => void;
    shotOptions?: any;
    parentVisuals?: VisualOutput[];
    parentProgress?: number;
    isGeneratingVisuals?: boolean;
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

// Editable Merged Prompts Component - Allows editing JSON before generation
interface EditableMergedPromptsProps {
    generationId: string;
    mergedPrompts: any;
    isDarkMode: boolean;
    onPromptsUpdated?: (updatedPrompts: any) => void;
}

const EditableMergedPrompts: React.FC<EditableMergedPromptsProps> = ({
    generationId,
    mergedPrompts,
    isDarkMode,
    onPromptsUpdated
}) => {
    const [editedJson, setEditedJson] = useState<string>(JSON.stringify(mergedPrompts, null, 2));
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Update editedJson when mergedPrompts prop changes
    useEffect(() => {
        setEditedJson(JSON.stringify(mergedPrompts, null, 2));
    }, [mergedPrompts]);

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditedJson(e.target.value);
        setIsEditing(true);
        setSaveSuccess(false);
        setSaveError(null);
    };

    const handleSave = async () => {
        try {
            // Validate JSON
            const parsedJson = JSON.parse(editedJson);
            setIsSaving(true);
            setSaveError(null);

            // Call API to update merged prompts
            const response = await updatePromptsAPI(generationId, { prompts: parsedJson });
            console.log('✅ Merged prompts updated:', response);

            setSaveSuccess(true);
            setIsEditing(false);

            if (onPromptsUpdated && response.merged_prompts) {
                onPromptsUpdated(response.merged_prompts);
            }

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

    return (
        <>
            {/* Controls */}
            <div className={styles.jsonControls}>
                <div className={styles.jsonTabs}>
                    <button className={`${styles.jsonTab} ${styles.active}`}>
                        Merged Prompts (Editable)
                    </button>
                </div>
                <div className={styles.editControls}>
                    <button
                        className={styles.saveBtn}
                        onClick={handleSave}
                        disabled={isSaving || !isEditing}
                    >
                        {isSaving ? (
                            <Loader2 size={14} className={styles.spin} />
                        ) : (
                            <CheckCircle2 size={14} />
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
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

            {/* Editable JSON */}
            <div className={styles.jsonContainer}>
                <textarea
                    className={styles.jsonEditor}
                    value={editedJson}
                    onChange={handleJsonChange}
                    spellCheck={false}
                    placeholder="Edit merged prompts JSON here..."
                />
            </div>
        </>
    );
};

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
    collectionId?: string;
    onAnalysisUpdate?: (updatedResponse: any) => void;
    onDAUpdate?: (updatedDA: DAJSON) => void;
    // NEW: For unified editing
    mergedPrompts?: any;
    generationId?: string | null;
    onPromptsUpdated?: (updatedPrompts: any) => void;
    isGenerating?: boolean;
    onConfirmGeneration?: () => void;
    onMerge?: () => void;
}

const AnalyzedState: React.FC<AnalyzedStateProps> = ({
    isDarkMode,
    productJSON,
    fullAnalysisResponse,
    daJSON,
    productId,
    collectionId,
    onAnalysisUpdate,
    onDAUpdate,
    // NEW props for unified editing
    mergedPrompts,
    generationId,
    onPromptsUpdated,
    isGenerating,
    onConfirmGeneration,
    onMerge
}) => {
    // Check if mergedPrompts has actual data (not empty object)
    const hasMergedPrompts = mergedPrompts && Object.keys(mergedPrompts).length > 0;

    const [activeTab, setActiveTab] = useState<'analysis' | 'da' | 'merged'>('analysis');
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

    // Get current JSON for display/editing
    const getCurrentJsonObj = useCallback(() => {
        if (activeTab === 'analysis') {
            return displayResponse.analysis;
        } else if (activeTab === 'da' && daJSON) {
            return daJSON;
        } else if (activeTab === 'merged' && hasMergedPrompts) {
            return mergedPrompts;
        }
        return displayResponse;
    }, [activeTab, displayResponse, daJSON, mergedPrompts, hasMergedPrompts]);

    // Update editedJson when tab or data changes
    useEffect(() => {
        if (!isEditing) {
            setEditedJson(formatJSON(getCurrentJsonObj()));
        }
    }, [activeTab, fullAnalysisResponse, getCurrentJsonObj, isEditing]);

    // Handle text change
    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditedJson(e.target.value);
        setIsEditing(true); // Mark as dirty/editing
        setSaveSuccess(false);
        setSaveError(null);
    };

    // Save changes
    const handleSave = async () => {
        try {
            // Validate JSON first
            const parsedJson = JSON.parse(editedJson);
            setIsSaving(true);
            setSaveError(null);

            if (activeTab === 'analysis') {
                // Save Product JSON - Direct edit to analyzed_product_json (persistent)
                if (!productId) {
                    setSaveError('Product ID not available');
                    setIsSaving(false);
                    return;
                }

                // Use updateProductAnalysis for persistent database save
                const { updateProductAnalysis } = await import('@/libs/server/HomePage/product');
                const response = await updateProductAnalysis(productId, parsedJson);
                console.log('✅ Product Analysis JSON saved to database:', response);

                if (onAnalysisUpdate && response.analyzed_product_json) {
                    onAnalysisUpdate({
                        ...fullAnalysisResponse,
                        analysis: response.analyzed_product_json,
                    });
                }
            } else if (activeTab === 'da') {
                // Save DA JSON
                if (!collectionId) {
                    setSaveError('Collection ID not available');
                    setIsSaving(false);
                    return;
                }

                const { updateDAJSON } = await import('@/libs/server/HomePage/collection');
                const response = await updateDAJSON(collectionId, {
                    analyzed_da_json: parsedJson
                });
                console.log('✅ DA JSON updated:', response);

                if (onDAUpdate && response.analyzed_da_json) {
                    onDAUpdate(response.analyzed_da_json as DAJSON);
                }
            } else if (activeTab === 'merged' && hasMergedPrompts && generationId) {
                // Update Merged Prompts
                const { updateMergedPrompts } = await import('@/libs/server/HomePage/merging');
                const response = await updateMergedPrompts(generationId, { prompts: parsedJson });
                console.log('✅ Merged prompts updated:', response);

                if (onPromptsUpdated && response.merged_prompts) {
                    onPromptsUpdated(response.merged_prompts);
                }
            }

            setSaveSuccess(true);
            setIsEditing(false);
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

            // Allow useEffect to update editedJson with new data
            setIsEditing(false);

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);

        } catch (error: any) {
            console.error('Reset failed:', error);
            setSaveError(error?.message || 'Failed to reset');
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
                <h2>{hasMergedPrompts ? 'Generation Created Successfully' : 'Product Analyzed Successfully'}</h2>
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

            {/* Tabs and Edit Controls */}
            <div className={styles.jsonControls}>
                <div className={styles.jsonTabs}>
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
                    {hasMergedPrompts && (
                        <button
                            className={`${styles.jsonTab} ${activeTab === 'merged' ? styles.active : ''}`}
                            onClick={() => { setActiveTab('merged'); setIsEditing(false); }}
                        >
                            Merged Prompts
                        </button>
                    )}
                </div>

                {/* Edit/Save/Reset Buttons */}
                <div className={styles.editControls}>
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
                    {activeTab === 'analysis' && (
                        <button className={styles.resetBtn} onClick={handleReset} disabled={isSaving}>
                            <RefreshCw size={14} className={isSaving ? styles.spin : ''} />
                            Reset
                        </button>
                    )}
                </div>
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
                <textarea
                    className={styles.jsonEditor}
                    value={editedJson}
                    onChange={handleJsonChange}
                    spellCheck={false}
                />
            </div>

            {/* Confirm Generation Button (Only when merged prompts exist) */}
            {hasMergedPrompts && onConfirmGeneration && (
                <div className={styles.actionButtons}>
                    <button
                        className={styles.confirmBtn}
                        onClick={onConfirmGeneration}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={18} className={styles.spin} />
                                <span>Generating Images...</span>
                            </>
                        ) : (
                            <>
                                <Play size={18} />
                                <span>Generate Images</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Merge Button (When DA selected but NOT merged yet) */}
            {daJSON && !hasMergedPrompts && onMerge && (
                <div className={styles.actionButtons}>
                    <button
                        className={styles.confirmBtn}
                        onClick={onMerge}
                        disabled={isGenerating}
                        style={{ background: '#4f46e5' }}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={18} className={styles.spin} />
                                <span>Merging...</span>
                            </>
                        ) : (
                            <>
                                <Layers size={18} />
                                <span>Merge Product & DA</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            <div className={styles.nextStepHint}>
                {hasMergedPrompts
                    ? <p>✨ Edit the prompts above if needed. Click "Generate Images" to start creation with Gemini AI.</p>
                    : daJSON
                        ? <p>✨ Click "Merge Product & DA" to create prompts for generation</p>
                        : <p>✨ Select a DA collection from the left sidebar to enable merging</p>
                }
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
    onDownload: (imageUrl: string, type: string) => void;
}

const VisualCard: React.FC<VisualCardProps> = ({ visual, index, isDarkMode, onRetry, onDownload }) => {
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

    // Handle single image download
    const handleDownload = () => {
        if (visual.image_url) {
            onDownload(visual.image_url, visual.type);
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
                                onClick={() => setIsZoomed(true)}
                            />
                            {/* Actions Overlay */}
                            <AnimatePresence>
                                {isHovered && (
                                    <motion.div
                                        className={styles.visualOverlay}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <button className={styles.actionBtn} onClick={() => setIsZoomed(true)} title="View Fullscreen">
                                            <Eye size={20} />
                                        </button>
                                        <button className={styles.actionBtn} onClick={handleDownload} title="Download">
                                            <Download size={20} />
                                        </button>
                                        <button className={styles.actionBtn} onClick={() => onRetry(index)} title="Regenerate">
                                            <RefreshCw size={20} />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    ) : (
                        <div className={styles.processingState}>
                            {visual.status === 'failed' ? (
                                <div className={styles.failedState}>
                                    <AlertCircle size={32} className={styles.errorIcon} />
                                    <p>Generation Failed</p>
                                    <button className={styles.retryBtn} onClick={() => onRetry(index)}>
                                        <RefreshCw size={14} /> Retry
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.loadingState}>
                                    <Loader2 size={32} className={styles.spin} />
                                    <p>{visual.status === 'processing' ? 'Generating...' : 'Pending'}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Image Zoom Modal */}
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
                            className={styles.zoomedImage}
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button className={styles.closeZoomFn} onClick={() => setIsZoomed(false)}>
                            <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
                        </button>
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
    shotOptions,
    ageMode = 'adult',
    isAnalyzing = false,
    onProductAnalyzed,
    onGenerationIdCreated,
    productId,
    onAnalysisUpdate,
    onDAUpdate,
    generationResponse,
    onConfirmGeneration,
    onMerge,
    parentVisuals,
    parentProgress,
    isGeneratingVisuals = false,
}) => {
    // Visuals State - use parent values if provided, otherwise local state
    const [localVisuals, setLocalVisuals] = useState<VisualOutput[]>([]);
    const [localProgress, setLocalProgress] = useState(0);
    const [localIsGenerating, setLocalIsGenerating] = useState(false);
    const [generationId, setGenerationId] = useState<string | null>(null);

    // Use parent visuals/progress if provided
    const visuals = parentVisuals || localVisuals;
    const progress = parentProgress ?? localProgress;
    const isGenerating = isGeneratingVisuals || localIsGenerating;
    const setVisuals = parentVisuals ? () => { } : setLocalVisuals;
    const setProgress = parentProgress !== undefined ? () => { } : setLocalProgress;
    const setIsGenerating = isGeneratingVisuals !== undefined ? () => { } : setLocalIsGenerating;

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

    // Handle single image download
    const handleSingleDownload = useCallback(async (imageUrl: string, type: string) => {
        try {
            // Fetch the image as blob
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            // Create a temporary link and trigger download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${type.replace(/_/g, '-')}-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Single image download failed:', error);
            alert('Failed to download image');
        }
    }, []);

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

    // Calculate effective merged prompts: use generationResponse.merged_prompts if available, else locally merged prompts
    const effectiveMergedPrompts = generationResponse?.merged_prompts || mergedPrompts;
    const effectiveGenerationId = generationResponse?.id || null;

    // WebSocket updates are handled by parent component (pages/index.tsx)
    // and passed via parentVisuals prop - no duplicate subscription needed

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
                            collectionId={selectedCollection?.id}
                            onAnalysisUpdate={onAnalysisUpdate}
                            onDAUpdate={onDAUpdate}
                            // Pass merged prompts info
                            mergedPrompts={effectiveMergedPrompts}
                            generationId={effectiveGenerationId}
                            onConfirmGeneration={onConfirmGeneration}
                            isGenerating={isGeneratingVisuals}
                            onMerge={onMerge ? () => onMerge(shotOptions) : undefined}
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
                                    onDownload={handleSingleDownload}
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