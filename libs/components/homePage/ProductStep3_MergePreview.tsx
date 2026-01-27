'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Sparkles,
    Users,
    User,
    Box,
    Eye,
    Maximize2,
    Camera,
    Layers
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

// Shot Types configuration
const SHOT_TYPES = [
    { id: 'DUO', name: 'Duo Shot', desc: 'Father + Son', icon: Users },
    { id: 'SOLO', name: 'Solo Shot', desc: 'Male Model', icon: User },
    { id: 'FLAT', name: 'Flat Lay', desc: 'Ghost Mannequin', icon: Box },
] as const;

// View Angles configuration
const VIEW_ANGLES = [
    { id: 'FRONT', name: 'Front', icon: Eye },
    { id: 'BACK', name: 'Back', icon: Eye },
    { id: 'CLOSEUP', name: 'Close-up', icon: Camera },
    { id: 'FLATLAY', name: 'Flatlay', icon: Layers },
] as const;

// Aspect Ratio configuration
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
    onBack,
    onGenerate,
    isGenerating,
}) => {
    // Resolution: Single select (2K or 4K)
    const [resolution, setResolution] = useState<'2K' | '4K'>('2K');

    // Aspect Ratio: Single select
    const [aspectRatio, setAspectRatio] = useState<string>('4:5');

    // Shot Types: Multi-select (ALL selected by default)
    const [selectedShots, setSelectedShots] = useState<Set<string>>(
        new Set(SHOT_TYPES.map(s => s.id))
    );

    // View Angles: Multi-select (ALL selected by default)
    const [selectedViews, setSelectedViews] = useState<Set<string>>(
        new Set(VIEW_ANGLES.map(v => v.id))
    );

    // Toggle shot type
    const toggleShot = (shotId: string) => {
        setSelectedShots(prev => {
            const next = new Set(prev);
            if (next.has(shotId)) {
                next.delete(shotId);
            } else {
                next.add(shotId);
            }
            return next;
        });
    };

    // Toggle view angle
    const toggleView = (viewId: string) => {
        setSelectedViews(prev => {
            const next = new Set(prev);
            if (next.has(viewId)) {
                next.delete(viewId);
            } else {
                next.add(viewId);
            }
            return next;
        });
    };

    // Calculate total variations
    const totalVariations = useMemo(() => {
        return selectedShots.size * selectedViews.size;
    }, [selectedShots, selectedViews]);

    // Calculate total cost
    const totalCost = useMemo(() => {
        const baseCost = totalVariations * COST_PER_VARIATION;
        // 4K costs 1.5x more
        return resolution === '4K' ? Math.ceil(baseCost * 1.5) : baseCost;
    }, [totalVariations, resolution]);

    // Generate example prompt preview with highlighting
    const examplePrompt = useMemo(() => {
        const shotType = Array.from(selectedShots)[0] || 'DUO';
        const viewAngle = Array.from(selectedViews)[0] || 'FRONT';

        return {
            product: `${productAnalysis.color} ${productAnalysis.type}`,
            material: productAnalysis.material,
            details: productAnalysis.details,
            background: daAnalysis.background,
            lighting: daAnalysis.lighting,
            mood: daAnalysis.mood,
            shotType,
            viewAngle,
        };
    }, [selectedShots, selectedViews, productAnalysis, daAnalysis]);

    // Can generate?
    const canGenerate = totalVariations > 0;

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
                {/* LEFT PANEL - CONTROLS */}
                <div className={styles.controlsPanel}>
                    {/* Resolution & Format Section */}
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
                                4K
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
                                    return (
                                        <motion.button
                                            key={shot.id}
                                            whileTap={{ scale: 0.95 }}
                                            layout
                                            className={`${styles.shotTypeCard} ${selectedShots.has(shot.id) ? styles.active : ''}`}
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
                            {VIEW_ANGLES.map(view => (
                                <motion.button
                                    key={view.id}
                                    whileTap={{ scale: 0.95 }}
                                    className={`${styles.viewChip} ${selectedViews.has(view.id) ? styles.active : ''}`}
                                    onClick={() => toggleView(view.id)}
                                >
                                    {view.name}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL - PREVIEW */}
                <div className={styles.previewPanel}>
                    {/* Order Summary */}
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
                    </motion.div>

                    {/* Prompt Preview */}
                    <div className={styles.promptPreviewCard}>
                        <h5 className={styles.promptPreviewTitle}>
                            <Sparkles size={14} />
                            Example Prompt Preview
                        </h5>
                        <p className={styles.promptPreviewText}>
                            A <span className={styles.productHighlight}>{examplePrompt.product}</span> made of{' '}
                            <span className={styles.productHighlight}>{examplePrompt.material}</span> with{' '}
                            <span className={styles.productHighlight}>{examplePrompt.details}</span>.{' '}
                            Shot in <span className={styles.daHighlight}>{examplePrompt.background}</span> setting with{' '}
                            <span className={styles.daHighlight}>{examplePrompt.lighting}</span> lighting.{' '}
                            <span className={styles.daHighlight}>{examplePrompt.mood}</span> mood.{' '}
                            {examplePrompt.shotType === 'DUO' && 'Father and son models wearing matching outfits.'}{' '}
                            {examplePrompt.shotType === 'SOLO' && 'Single male model in professional pose.'}{' '}
                            {examplePrompt.shotType === 'FLAT' && 'Product displayed on ghost mannequin.'}
                        </p>
                    </div>

                    {/* Cost Estimation */}
                    <div className={styles.costCard}>
                        <p className={styles.costLabel}>Total Cost</p>
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
                            Generate Batch ({totalCost} Credits)
                        </>
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
};

export default ProductStep3_MergePreview;
