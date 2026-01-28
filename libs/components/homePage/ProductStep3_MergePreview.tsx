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
    Check,
    Camera,
    Layers
} from 'lucide-react';
import styles from '@/scss/styles/HomePage/ProductStep3.module.scss';
import { ProductAnalysis } from './ProductStep2_Analysis';

// Type definitions matching backend AnalyzedDAJSON
interface DAAnalysis {
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
    styling: {
        bottom: string;
        feet: string;
        accessories?: string;
    };
    camera: {
        focal_length_mm: number;
        aperture: number;
        focus: string;
    };
    quality: string;
    analyzed_at?: string;
}

type MergedPrompts = Record<string, string>;

interface ProductStep3Props {
    productAnalysis: ProductAnalysis;
    daAnalysis: DAAnalysis;
    mergedPrompts: MergedPrompts;
    onPromptsChange: (key: keyof MergedPrompts, value: string) => void;
    onBack: () => void;
    onGenerate: (selectedShots: string[]) => void;
    isGenerating: boolean;
    isMerging: boolean; // NEW: for merge loading state
}

// ===== THE 6-SHOT SYSTEM =====
// Exactly 6 selectable shot types - NO matrix, NO complexity
const SHOT_TYPES = [
    { id: 'duo', name: 'Duo', desc: 'Father & Son', icon: Users },
    { id: 'solo', name: 'Solo', desc: 'Male Model', icon: User },
    { id: 'flatlay_front', name: 'Flatlay', desc: 'Front', icon: Box },
    { id: 'flatlay_back', name: 'Flatlay', desc: 'Angled/Back', icon: Layers },
    { id: 'closeup_front', name: 'Detail', desc: 'Front', icon: Camera },
    { id: 'closeup_back', name: 'Detail', desc: 'Back', icon: Camera },
] as const;

// Aspect Ratios
const ASPECT_RATIOS = [
    { id: '1:1', name: '1:1', className: 'square' },
    { id: '4:5', name: '4:5', className: 'portrait' },
    { id: '9:16', name: '9:16', className: 'story' },
] as const;

// Cost per shot
const COST_PER_SHOT = 2;

const ProductStep3_MergePreview: React.FC<ProductStep3Props> = ({
    productAnalysis,
    daAnalysis,
    onBack,
    onGenerate,
    isGenerating,
    isMerging, // NEW
}) => {
    // Resolution: Single select (2K or 4K) - Default: 2K
    const [resolution, setResolution] = useState<'2K' | '4K'>('2K');

    // Aspect Ratio: Single select - Default: 4:5
    const [aspectRatio, setAspectRatio] = useState<string>('4:5');

    // Shot Types: ALL 6 selected by default
    const [selectedShots, setSelectedShots] = useState<Set<string>>(
        new Set(SHOT_TYPES.map(s => s.id))
    );

    // Prompt editing state
    const [isEditingPrompt, setIsEditingPrompt] = useState(false);
    const [editedPrompt, setEditedPrompt] = useState('');

    // Toggle shot type (multi-select, min 1)
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

    // Total = number of selected shots (1-6)
    const totalShots = selectedShots.size;

    // Calculate total cost
    const totalCost = useMemo(() => {
        const baseCost = totalShots * COST_PER_SHOT;
        // 4K costs 1.5x more
        return resolution === '4K' ? Math.ceil(baseCost * 1.5) : baseCost;
    }, [totalShots, resolution]);

    // Generate example prompt — dynamically pulls from actual Collection DA
    const examplePrompt = useMemo(() => {
        const hexPart = productAnalysis.color_hex ? ` (${productAnalysis.color_hex})` : '';
        const texturePart = productAnalysis.texture ? `, ${productAnalysis.texture}` : '';
        const productPart = `${productAnalysis.color}${hexPart} ${productAnalysis.type} made of ${productAnalysis.material}${texturePart}`;
        const detailsPart = productAnalysis.details;
        const daPart = `${daAnalysis.background.description} setting with ${daAnalysis.lighting.type} (${daAnalysis.lighting.temperature}) lighting, ${daAnalysis.mood} mood`;

        return { productPart, detailsPart, daPart };
    }, [productAnalysis, daAnalysis]);

    // Initialize edited prompt
    React.useEffect(() => {
        const fullPrompt = `A ${examplePrompt.productPart} with ${examplePrompt.detailsPart}. Shot in ${examplePrompt.daPart}.`;
        setEditedPrompt(fullPrompt);
    }, [examplePrompt]);

    // Can generate?
    const canGenerate = totalShots > 0;

    // Handle prompt save
    const handleSavePrompt = () => {
        setIsEditingPrompt(false);
    };

    // Handle back navigation
    const handleBack = () => {
        onBack();
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className={styles.step3Container}
        >
            {/* Merging Loading Overlay */}
            <AnimatePresence>
                {isMerging && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.mergingOverlay}
                    >
                        <div className={styles.mergingContent}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className={styles.mergingSpinner}
                            >
                                <Sparkles size={48} />
                            </motion.div>
                            <h3 className={styles.mergingTitle}>Merging Prompts...</h3>
                            <p className={styles.mergingText}>
                                AI is combining product details with collection style
                            </p>
                            <motion.div
                                className={styles.mergingDots}
                                initial={{ opacity: 0.3 }}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <span>●</span>
                                <span>●</span>
                                <span>●</span>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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

                    {/* ===== THE 6-SHOT SELECTION ===== */}
                    <div className={styles.sectionCard}>
                        <h4 className={styles.sectionTitle}>Shot Types ({totalShots} selected)</h4>
                        <div className={styles.shotGrid}>
                            <AnimatePresence>
                                {SHOT_TYPES.map(shot => {
                                    const Icon = shot.icon;
                                    const isActive = selectedShots.has(shot.id);
                                    return (
                                        <motion.button
                                            key={shot.id}
                                            whileTap={{ scale: 0.95 }}
                                            layout
                                            className={`${styles.shotCard} ${isActive ? styles.active : ''}`}
                                            onClick={() => toggleShot(shot.id)}
                                        >
                                            <div className={styles.shotIcon}>
                                                <Icon size={24} />
                                            </div>
                                            <div className={styles.shotInfo}>
                                                <span className={styles.shotName}>{shot.name}</span>
                                                <span className={styles.shotDesc}>{shot.desc}</span>
                                            </div>
                                            {isActive && (
                                                <motion.div
                                                    className={styles.checkMark}
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    exit={{ scale: 0 }}
                                                >
                                                    <Check size={12} />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
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
                            Generating <span className={styles.highlight}>{totalShots} Images</span> in{' '}
                            <span className={styles.highlight}>{aspectRatio}</span> at{' '}
                            <span className={styles.highlight}>{resolution}</span>
                        </p>
                    </motion.div>

                    {/* Prompt Preview */}
                    <div className={styles.promptPreviewCard}>
                        <div className={styles.promptPreviewHeader}>
                            <h5 className={styles.promptPreviewTitle}>
                                <Sparkles size={14} />
                                Prompt Preview
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
                                Shot in <span className={styles.daHighlight}>{examplePrompt.daPart}</span>.
                            </p>
                        )}
                    </div>

                    {/* Cost Card */}
                    <div className={styles.costCard}>
                        <div className={styles.costInfo}>
                            <p className={styles.costLabel}>Total Cost</p>
                            <p className={styles.costBreakdown}>
                                {totalShots} shots × {COST_PER_SHOT} credits
                                {resolution === '4K' && ' (+50%)'}
                            </p>
                        </div>
                        <p className={styles.costValue}>{totalCost} Credits</p>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className={styles.step3ActionBar}>
                <button className={styles.backButton} onClick={handleBack}>
                    <ArrowLeft size={18} />
                    Back
                </button>

                <motion.button
                    whileHover={{ scale: canGenerate ? 1.02 : 1 }}
                    whileTap={{ scale: canGenerate ? 0.98 : 1 }}
                    className={`${styles.generateButton} ${isGenerating ? styles.generating : ''}`}
                    onClick={() => onGenerate(Array.from(selectedShots))}
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
                            Generate {totalShots} Images
                        </>
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
};

export default ProductStep3_MergePreview;
