'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Package, Sparkles, Wand2, Check } from 'lucide-react';
import styles from '@/scss/styles/HomePage/HomeMiddle.module.scss';
import ProductStep1_Upload from './ProductStep1_Upload';
import ProductStep2_Analysis, { ProductAnalysis } from './ProductStep2_Analysis';
import ProductStep3_MergePreview from './ProductStep3_MergePreview';
import ProductStep4_Results from './ProductStep4_Results';
import { createProduct, analyzeProduct } from '@/libs/server/HomePage/product';
import { AnalyzedProductJSON } from '@/libs/types/homepage/product';
import { Brand } from '@/libs/types/homepage/brand';
// 🆕 Generation API imports
import {
    startGeneration,
    pollGenerationStatus,
    retryFailedVisual,
    triggerDownload,
} from '@/libs/server/HomePage/generate';
import {
    createGeneration,
    updateMergedPrompts as updatePromptsAPI,
} from '@/libs/server/HomePage/merging';

interface HomeMiddleProps {
    isDarkMode?: boolean;
    selectedCollection?: { id: string; name: string } | null;
    selectedBrand?: Brand | null;
}

interface MergedPrompts {
    main_visual: string;
    lifestyle: string;
    detail_shots: string;
    model_poses: string;
}

interface VisualOutput {
    type: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    image_url?: string;
    error?: string;
}

// Mock DA Analysis (from collection setup)
const mockDAAnalysis = {
    background: "Clean white cyclorama with soft natural shadows",
    lighting: "Soft diffused daylight, warm golden hour tones",
    composition: "Editorial centered portrait, depth of field",
    props_decor: "Minimalist wooden stool, dried pampas grass",
    mood: "Serene, sophisticated, effortlessly elegant",
};

// Mock Product Analysis
const mockProductAnalysis: ProductAnalysis = {
    type: "Zip Tracksuit Set",
    color: "Forest Green",
    material: "Velour",
    details: "White piping, gold zipper",
    logo_front: "Romimi script embroidery (Chest)",
    logo_back: "RR monogram circle (Center)",
};

const HomeMiddle: React.FC<HomeMiddleProps> = ({
    isDarkMode = true,
    selectedCollection,
    selectedBrand,
}) => {
    // Wizard State
    const [currentStep, setCurrentStep] = useState(1);

    // Step 1: Images
    const [frontImage, setFrontImage] = useState<File | null>(null);
    const [backImage, setBackImage] = useState<File | null>(null);
    const [referenceImages, setReferenceImages] = useState<File[]>([]);

    // Step 2: Analysis
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [productAnalysis, setProductAnalysis] = useState<ProductAnalysis>(mockProductAnalysis);
    const [productId, setProductId] = useState<string | null>(null);
    const [generationId, setGenerationId] = useState<string | null>(null);

    // Step 3: Merged Prompts
    const [isGenerating, setIsGenerating] = useState(false);
    const [mergedPrompts, setMergedPrompts] = useState<MergedPrompts>({
        main_visual: '',
        lifestyle: '',
        detail_shots: '',
        model_poses: '',
    });

    // Step 4: Results
    const [visuals, setVisuals] = useState<VisualOutput[]>([]);
    const [progress, setProgress] = useState(0);

    // Step Definitions
    const steps = [
        { number: 1, label: 'Upload', icon: <Package size={16} /> },
        { number: 2, label: 'Analysis', icon: <Sparkles size={16} /> },
        { number: 3, label: 'Preview', icon: <Wand2 size={16} /> },
        { number: 4, label: 'Results', icon: <Check size={16} /> },
    ];

    // Handlers
    const handleAnalyze = useCallback(async () => {
        if (!frontImage || !backImage) {
            alert('Please upload both front and back images.');
            return;
        }

        if (!selectedCollection) {
            alert('Please select a collection first.');
            return;
        }

        setIsAnalyzing(true);
        try {
            // 1. Create Product
            const productName = `Product ${new Date().toLocaleString()}`;
            const product = await createProduct(
                productName,
                selectedCollection.id,
                frontImage,
                backImage,
                referenceImages
            );

            // 2. Analyze Product
            const analysisResponse = await analyzeProduct(product.id);
            const json = analysisResponse.analyzed_product_json;

            // 3. Map result to state
            const mappedAnalysis: ProductAnalysis = {
                type: json.product_type || 'Unknown Product',
                color: json.colors?.[0] || 'Unknown Color',
                material: json.materials?.[0] || 'Unknown Material',
                details: json.features?.join(', ') || '',
                logo_front: (json as any).logo_front || 'None',
                logo_back: (json as any).logo_back || 'None',
            };

            setProductAnalysis(mappedAnalysis);
            setProductId(product.id);
            setCurrentStep(2);
        } catch (error) {
            console.error('Analysis failed:', error);
            alert('Failed to analyze product. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    }, [frontImage, backImage, referenceImages, selectedCollection]);

    const handleAnalysisChange = useCallback((field: keyof ProductAnalysis, value: string) => {
        setProductAnalysis(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleGoToMerge = useCallback(async () => {
        if (!productId || !selectedCollection) {
            alert('Missing product or collection information.');
            return;
        }

        try {
            // Create Generation record
            const generation = await createGeneration({
                product_id: productId,
                collection_id: selectedCollection.id,
                generation_type: 'standard',
            });

            setGenerationId(generation.id);

            // Generate merged prompts from product + DA
            const product = productAnalysis;
            const da = mockDAAnalysis;

            setMergedPrompts({
                main_visual: `A ${product.type} in ${product.color} ${product.material} with ${product.details}. ${product.logo_front} on front. Photographed with ${da.lighting}. ${da.background}. ${da.mood} aesthetic.`,
                lifestyle: `Fashion editorial featuring ${product.type} in ${product.color}. Model in natural pose with ${da.props_decor}. ${da.lighting}. Cinematic depth of field.`,
                detail_shots: `Close-up product photography: ${product.material} texture, ${product.details}. ${da.lighting}. Clean white background.`,
                model_poses: `Full body shot: ${product.type} styled casually. Model facing camera, hands in pockets. ${da.background}. ${da.composition}.`,
            });
            setCurrentStep(3);
        } catch (error) {
            console.error('Failed to create generation:', error);
            alert('Failed to create generation. Please try again.');
        }
    }, [productAnalysis, productId, selectedCollection]);

    const handlePromptsChange = useCallback(async (key: keyof MergedPrompts, value: string) => {
        // Update local state immediately
        setMergedPrompts(prev => {
            const updated = { ...prev, [key]: value };

            // Save to backend if we have a generationId
            if (generationId) {
                updatePromptsAPI(generationId, { prompts: updated }).catch(error => {
                    console.error('Failed to update prompts on backend:', error);
                });
            }

            return updated;
        });
    }, [generationId]);

    const handleGenerate = useCallback(async () => {
        if (!generationId) {
            alert('Generation ID not found. Please try again.');
            return;
        }

        setIsGenerating(true);
        setCurrentStep(4);

        try {
            // Start generation on the backend
            await startGeneration(generationId, {
                visual_types: ['main_visual', 'lifestyle', 'detail_front', 'detail_back', 'model_pose_1', 'model_pose_2'],
                quality: 'standard',
            });

            // Poll for progress updates
            const pollInterval = setInterval(async () => {
                try {
                    const status = await pollGenerationStatus(generationId);

                    // Update visuals with backend data
                    setVisuals(status.visuals);
                    setProgress(status.progress);

                    // Stop polling when complete
                    if (status.isComplete) {
                        clearInterval(pollInterval);
                        setIsGenerating(false);
                    }
                } catch (error) {
                    console.error('Error polling generation status:', error);
                    clearInterval(pollInterval);
                    setIsGenerating(false);
                }
            }, 2000); // Poll every 2 seconds

            // Safety timeout: stop polling after 10 minutes
            setTimeout(() => {
                clearInterval(pollInterval);
                setIsGenerating(false);
            }, 600000);

        } catch (error) {
            console.error('Failed to start generation:', error);
            alert('Failed to start generation. Please try again.');
            setIsGenerating(false);
        }
    }, [generationId]);

    const handleRetry = useCallback(async (index: number) => {
        if (!generationId) {
            alert('Generation ID not found.');
            return;
        }

        try {
            // Update UI to show processing
            setVisuals(prev => prev.map((v, i) =>
                i === index ? { ...v, status: 'processing' } : v
            ));

            // Call retry API
            await retryFailedVisual(generationId, index);

            // Poll for status update after retry
            const pollRetry = setInterval(async () => {
                try {
                    const status = await pollGenerationStatus(generationId);
                    setVisuals(status.visuals);

                    // Check if this specific visual is done
                    if (status.visuals[index]?.status === 'completed' || status.visuals[index]?.status === 'failed') {
                        clearInterval(pollRetry);
                    }
                } catch (error) {
                    console.error('Error polling retry status:', error);
                    clearInterval(pollRetry);
                }
            }, 2000);

            // Safety timeout
            setTimeout(() => clearInterval(pollRetry), 60000);

        } catch (error) {
            console.error('Failed to retry visual:', error);
            alert('Failed to retry. Please try again.');
            setVisuals(prev => prev.map((v, i) =>
                i === index ? { ...v, status: 'failed' } : v
            ));
        }
    }, [generationId]);

    const handleDownload = useCallback(async () => {
        if (!generationId) {
            alert('Generation ID not found.');
            return;
        }

        try {
            await triggerDownload(generationId, `product-visuals-${productId}.zip`);
        } catch (error) {
            console.error('Failed to download:', error);
            alert('Failed to download visuals. Please try again.');
        }
    }, [generationId, productId]);

    const handleStartNew = useCallback(() => {
        setCurrentStep(1);
        setFrontImage(null);
        setBackImage(null);
        setReferenceImages([]);
        setProductAnalysis(mockProductAnalysis);
        setProductId(null);
        setGenerationId(null);
        setMergedPrompts({ main_visual: '', lifestyle: '', detail_shots: '', model_poses: '' });
        setVisuals([]);
        setProgress(0);
    }, []);

    const frontPreview = useMemo(() =>
        frontImage ? URL.createObjectURL(frontImage) : undefined,
        [frontImage]);

    const isComplete = visuals.length > 0 && visuals.every(v => v.status === 'completed' || v.status === 'failed');

    return (
        <div className={`${styles.wizardContainer} ${isDarkMode ? styles.dark : styles.light}`}>
            {/* Header */}
            <div className={styles.wizardHeader}>
                <h1 className={styles.wizardTitle}>Create Product Visuals</h1>
                <p className={styles.wizardSubtitle}>
                    {selectedCollection && selectedBrand
                        ? (
                            <>
                                <span style={{ opacity: 0.6 }}>{selectedBrand.name}</span>
                                <span style={{ margin: '0 8px', opacity: 0.4 }}>/</span>
                                <span>{selectedCollection.name}</span>
                            </>
                        )
                        : (selectedCollection
                            ? `Generating for: ${selectedCollection.name}`
                            : 'Upload product photos and generate AI visuals'
                        )
                    }
                </p>
            </div>

            {/* Step Indicator */}
            <div className={styles.stepIndicator}>
                {steps.map((step, index) => (
                    <React.Fragment key={step.number}>
                        <div
                            className={`${styles.stepDot} ${currentStep === step.number ? styles.active : ''} ${currentStep > step.number ? styles.completed : ''}`}
                        >
                            {currentStep > step.number ? <Check size={16} /> : step.number}
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`${styles.stepLine} ${currentStep > step.number ? styles.active : ''}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step Content */}
            <div className={styles.stepContent}>
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <ProductStep1_Upload
                            key="step1"
                            frontImage={frontImage}
                            backImage={backImage}
                            referenceImages={referenceImages}
                            onFrontImageChange={setFrontImage}
                            onBackImageChange={setBackImage}
                            onReferenceImagesChange={setReferenceImages}
                            onNext={handleAnalyze}
                            isAnalyzing={isAnalyzing}
                        />
                    )}
                    {currentStep === 2 && (
                        <ProductStep2_Analysis
                            key="step2"
                            analysis={productAnalysis}
                            onAnalysisChange={handleAnalysisChange}
                            onBack={() => setCurrentStep(1)}
                            onNext={handleGoToMerge}
                            frontImagePreview={frontPreview}
                        />
                    )}
                    {currentStep === 3 && (
                        <ProductStep3_MergePreview
                            key="step3"
                            productAnalysis={productAnalysis}
                            daAnalysis={mockDAAnalysis}
                            mergedPrompts={mergedPrompts}
                            onPromptsChange={handlePromptsChange}
                            onBack={() => setCurrentStep(2)}
                            onGenerate={handleGenerate}
                            isGenerating={isGenerating}
                        />
                    )}
                    {currentStep === 4 && (
                        <ProductStep4_Results
                            key="step4"
                            visuals={visuals}
                            progress={progress}
                            isComplete={isComplete}
                            onRetry={handleRetry}
                            onDownload={handleDownload}
                            onStartNew={handleStartNew}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default HomeMiddle;