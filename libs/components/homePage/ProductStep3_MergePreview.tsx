'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Sparkles,
    Users,
    User,
    Box,
    Maximize2,
    Pencil,
    Check
} from 'lucide-react';
import styles from '@/scss/styles/HomePage/ProductStep3.module.scss';
import { ProductAnalysis } from './ProductStep2_Analysis';

// Type definitions
interface DAAnalysis {
    background: string;
    lighting: string;
    composition: string;
    props_decor: string;
    mood: string;
}

interface MergedPrompts {
    main_visual: string;
    lifestyle: string;
    detail_shots: string;
    model_poses: string;
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

// Shot Types - Backend mapping
const SHOT_TYPES = [
    { id: 'DUO', name: 'Duo Shot', desc: 'Father + Son', icon: Users },
    { id: 'SOLO', name: 'Solo Shot', desc: 'Male Model', icon: User },
    { id: 'FLAT', name: 'Flat Lay', desc: 'Ghost Mannequin', icon: Box },
] as const;

// View Angles - with Backend mapping
// Close-up maps to BOTH FCLOSE and BCLOSE
const VIEW_ANGLES = [
    { id: 'FRONT', name: 'Front', backendCodes: ['F'] },
    { id: 'BACK', name: 'Back', backendCodes: ['B'] },
    { id: 'CLOSEUP', name: 'Close-up', backendCodes: ['FCLOSE', 'BCLOSE'] }, // Batch group
    { id: 'FLATLAY', name: 'Flatlay', backendCodes: ['FFLAT'] },
] as const;

// Aspect Ratios
const ASPECT_RATIOS = [
    { id: '1:1', name: '1:1', className: 'square' },
    { id: '4:5', name: '4:5', className: 'portrait' },
    { id: '9:16', name: '9:16', className: 'story' },
] as const;

// Cost per variation
const COST_PER_VARIATION = 2;

const ProductStep3_MergePreview: React.FC<ProductStep3Props> = ({
    productAnalysis,
    daAnalysis,
    mergedPrompts,
    onPromptsChange,
    onBack,
    onGenerate,
    isGenerating,
}) => {
    // Resolution: Single select (2K or 4K) - Default: 2K
    const [resolution, setResolution] = useState<'2K' | '4K'>('2K');

    // Aspect Ratio: Single select - Default: 4:5
    const [aspectRatio, setAspectRatio] = useState<string>('4:5');

    // Shot Types: Multi-select - Default: ALL selected
    const [selectedShots, setSelectedShots] = useState<Set<string>>(
        new Set(SHOT_TYPES.map(s => s.id))
    );

    // View Angles: Multi-select - Default: ALL selected
    const [selectedViews, setSelectedViews] = useState<Set<string>>(
        new Set(VIEW_ANGLES.map(v => v.id))
    );

    // Prompt editing state
    const [isEditingPrompt, setIsEditingPrompt] = useState(false);
    const [editedPrompt, setEditedPrompt] = useState('');

    // Toggle shot type (multi-select)
    const toggleShot = (shotId: string) => {
        setSelectedShots(prev => {
            const next = new Set(prev);
            if (next.has(shotId)) {
                // Don't allow deselecting if it's the last one
                if (next.size > 1) next.delete(shotId);
            } else {
                next.add(shotId);
            }
            return next;
        });
    };

    // Toggle view angle (multi-select)
    const toggleView = (viewId: string) => {
        setSelectedViews(prev => {
            const next = new Set(prev);
            if (next.has(viewId)) {
                // Don't allow deselecting if it's the last one
                if (next.size > 1) next.delete(viewId);
            } else {
                next.add(viewId);
            }
            return next;
        });
    };

    // Calculate total backend codes for variations
    const totalBackendViews = useMemo(() => {
        let count = 0;
        VIEW_ANGLES.forEach(view => {
            if (selectedViews.has(view.id)) {
                count += view.backendCodes.length;
            }
        });
        return count;
    }, [selectedViews]);

    // Calculate total variations (shots × views)
    const totalVariations = useMemo(() => {
        return selectedShots.size * totalBackendViews;
    }, [selectedShots, totalBackendViews]);

    // Calculate total cost
    const totalCost = useMemo(() => {
        const baseCost = totalVariations * COST_PER_VARIATION;
        // 4K costs 1.5x more
        return resolution === '4K' ? Math.ceil(baseCost * 1.5) : baseCost;
    }, [totalVariations, resolution]);

    // Generate example prompt with highlighting
    const examplePrompt = useMemo(() => {
        const shotType = Array.from(selectedShots)[0] || 'DUO';

        // Build the example prompt text
        const productPart = `${productAnalysis.color} ${productAnalysis.type} made of ${productAnalysis.material}`;
        const detailsPart = productAnalysis.details;
        const daPart = `${daAnalysis.background} setting with ${daAnalysis.lighting} lighting, ${daAnalysis.mood} mood`;

        let modelDesc = '';
        if (shotType === 'DUO') modelDesc = 'Father and son models wearing matching outfits';
        else if (shotType === 'SOLO') modelDesc = 'Single male model in professional pose';
        else modelDesc = 'Product displayed on ghost mannequin';

        return { productPart, detailsPart, daPart, modelDesc };
    }, [selectedShots, productAnalysis, daAnalysis]);

    // Initialize edited prompt
    React.useEffect(() => {
        const fullPrompt = `A ${examplePrompt.productPart} with ${examplePrompt.detailsPart}. Shot in ${examplePrompt.daPart}. ${examplePrompt.modelDesc}.`;
        setEditedPrompt(fullPrompt);
    }, [examplePrompt]);

    // Can generate?
    const canGenerate = totalVariations > 0;

    // Handle prompt save
    const handleSavePrompt = () => {
        setIsEditingPrompt(false);
        // Here you could call onPromptsChange if needed
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className={styles.step3Container}
        >
            {/* Split Layout */}
            <div className={styles.consoleLayout}>
                {/* LEFT PANEL - CONFIGURATION */}
                <div className={styles.controlsPanel}>
                    {/* Resolution Section */}
                    <div className={styles.sectionCard}>
                        <h4 className={styles.sectionTitle}>Resolution</h4>
                        <div className={styles.segmentedControl}>
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                className={`${styles.segmentButton} ${resolution === '2K' ? styles.active : ''}`}
                                onClick={() => setResolution('2K')}
                            >
                                2K
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                className={`${styles.segmentButton} ${resolution === '4K' ? styles.active : ''}`}
                                onClick={() => setResolution('4K')}
                            >
                                4K <span className={styles.premiumBadge}>+50%</span>
                            </motion.button>
                        </div>
                    </div>

                    {/* Aspect Ratio Section */}
                    <div className={styles.sectionCard}>
                        <h4 className={styles.sectionTitle}>Aspect Ratio</h4>
                        <div className={styles.ratioOptions}>
                            {ASPECT_RATIOS.map(ratio => (
                                <motion.button
                                    key={ratio.id}
                                    whileTap={{ scale: 0.95 }}
                                    className={`${styles.ratioButton} ${aspectRatio === ratio.id ? styles.active : ''}`}
                                    onClick={() => setAspectRatio(ratio.id)}
                                >
                                    <div className={`${styles.ratioIcon} ${styles[ratio.className]}`} />
                                    <span className={styles.ratioLabel}>{ratio.name}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Shot Types Section */}
                    <div className={styles.sectionCard}>
                        <h4 className={styles.sectionTitle}>Shot Types</h4>
                        <div className={styles.shotTypeGrid}>
                            <AnimatePresence>
                                {SHOT_TYPES.map(shot => {
                                    const Icon = shot.icon;
                                    const isActive = selectedShots.has(shot.id);
                                    return (
                                        <motion.button
                                            key={shot.id}
                                            whileTap={{ scale: 0.95 }}
                                            layout
                                            className={`${styles.shotTypeCard} ${isActive ? styles.active : ''}`}
                                            onClick={() => toggleShot(shot.id)}
                                        >
                                            <div className={styles.shotTypeIcon}>
                                                <Icon size={28} />
                                            </div>
                                            <span className={styles.shotTypeName}>{shot.name}</span>
                                            <span className={styles.shotTypeDesc}>{shot.desc}</span>
                                        </motion.button>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* View Angles Section */}
                    <div className={styles.sectionCard}>
                        <h4 className={styles.sectionTitle}>View Angles</h4>
                        <div className={styles.viewAngleChips}>
                            {VIEW_ANGLES.map(view => {
                                const isActive = selectedViews.has(view.id);
                                return (
                                    <motion.button
                                        key={view.id}
                                        whileTap={{ scale: 0.95 }}
                                        className={`${styles.viewChip} ${isActive ? styles.active : ''}`}
                                        onClick={() => toggleView(view.id)}
                                    >
                                        {view.name}
                                        {view.id === 'CLOSEUP' && (
                                            <span className={styles.chipBadge}>×2</span>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                        <p className={styles.viewHint}>
                            *Close-up generates both front and back detail shots
                        </p>
                    </div>
                </div>

                {/* RIGHT PANEL - PREVIEW */}
                <div className={styles.previewPanel}>
                    {/* Generation Summary */}
                    <motion.div
                        className={styles.summaryCard}
                        layout
                    >
                        <h5 className={styles.summaryTitle}>Generation Summary</h5>
                        <p className={styles.summaryText}>
                            Generating <span className={styles.highlight}>{totalVariations} Variations</span> in{' '}
                            <span className={styles.highlight}>{aspectRatio}</span> aspect ratio at{' '}
                            <span className={styles.highlight}>{resolution}</span> resolution.
                        </p>
                        <div className={styles.summaryBreakdown}>
                            <span>{selectedShots.size} Shot Types</span>
                            <span className={styles.separator}>×</span>
                            <span>{totalBackendViews} Angles</span>
                            <span className={styles.separator}>=</span>
                            <span className={styles.total}>{totalVariations}</span>
                        </div>
                    </motion.div>

                    {/* Prompt Preview */}
                    <div className={styles.promptPreviewCard}>
                        <div className={styles.promptPreviewHeader}>
                            <h5 className={styles.promptPreviewTitle}>
                                <Sparkles size={14} />
                                Example Prompt Preview
                            </h5>
                            <button
                                className={styles.editButton}
                                onClick={() => isEditingPrompt ? handleSavePrompt() : setIsEditingPrompt(true)}
                            >
                                {isEditingPrompt ? <Check size={14} /> : <Pencil size={14} />}
                                {isEditingPrompt ? 'Save' : 'Edit'}
                            </button>
                        </div>

                        {isEditingPrompt ? (
                            <textarea
                                className={styles.promptTextarea}
                                value={editedPrompt}
                                onChange={(e) => setEditedPrompt(e.target.value)}
                                rows={5}
                            />
                        ) : (
                            <p className={styles.promptPreviewText}>
                                A <span className={styles.productHighlight}>{examplePrompt.productPart}</span> with{' '}
                                <span className={styles.productHighlight}>{examplePrompt.detailsPart}</span>.{' '}
                                Shot in <span className={styles.daHighlight}>{examplePrompt.daPart}</span>.{' '}
                                {examplePrompt.modelDesc}.
                            </p>
                        )}
                    </div>

                    {/* Cost Card */}
                    <div className={styles.costCard}>
                        <div className={styles.costInfo}>
                            <p className={styles.costLabel}>Total Cost</p>
                            <p className={styles.costBreakdown}>
                                {totalVariations} × {COST_PER_VARIATION} credits
                                {resolution === '4K' && ' (+50% for 4K)'}
                            </p>
                        </div>
                        <p className={styles.costValue}>{totalCost} Credits</p>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className={styles.step3ActionBar}>
                <button className={styles.backButton} onClick={onBack}>
                    <ArrowLeft size={18} />
                    Back
                </button>

                <motion.button
                    whileHover={{ scale: canGenerate ? 1.02 : 1 }}
                    whileTap={{ scale: canGenerate ? 0.98 : 1 }}
                    className={`${styles.generateButton} ${isGenerating ? styles.generating : ''}`}
                    onClick={onGenerate}
                    disabled={!canGenerate || isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                                <Sparkles size={20} />
                            </motion.div>
                            Generating...
                        </>
                    ) : (
                        <>
                            <Maximize2 size={18} />
                            Generate Batch
                        </>
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
};

export default ProductStep3_MergePreview;
