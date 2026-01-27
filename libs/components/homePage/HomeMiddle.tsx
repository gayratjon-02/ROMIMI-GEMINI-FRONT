'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Package, Sparkles, Wand2, Check } from 'lucide-react';
import styles from '@/scss/styles/HomePage/HomeMiddle.module.scss';
import ProductStep1_Upload from './ProductStep1_Upload';
import ProductStep2_Analysis, { ProductAnalysis } from './ProductStep2_Analysis';
import ProductStep3_MergePreview from './ProductStep3_MergePreview';
import ProductStep4_Results from './ProductStep4_Results';
import { createProduct, analyzeProduct } from '@/libs/server/HomePage/product';
import { AnalyzedProductJSON } from '@/libs/types/homepage/product';

interface HomeMiddleProps {
    isDarkMode?: boolean;
    selectedCollection?: { id: string; name: string } | null;
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

    const handleGoToMerge = useCallback(() => {
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
    }, [productAnalysis]);

    const handlePromptsChange = useCallback((key: keyof MergedPrompts, value: string) => {
        setMergedPrompts(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleGenerate = useCallback(async () => {
        setIsGenerating(true);

        // Initialize visuals with pending status
        const initialVisuals: VisualOutput[] = [
            { type: 'main_visual', status: 'pending' },
            { type: 'lifestyle', status: 'pending' },
            { type: 'detail_front', status: 'pending' },
            { type: 'detail_back', status: 'pending' },
            { type: 'model_pose_1', status: 'pending' },
            { type: 'model_pose_2', status: 'pending' },
        ];
        setVisuals(initialVisuals);
        setCurrentStep(4);
        setIsGenerating(false);

        // Simulate progressive generation
        for (let i = 0; i < initialVisuals.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 800));

            // Set processing
            setVisuals(prev => prev.map((v, idx) =>
                idx === i ? { ...v, status: 'processing' } : v
            ));

            await new Promise(resolve => setTimeout(resolve, 1500));

            // Set completed (or occasionally failed for demo)
            const isFailed = i === 3 && Math.random() > 0.7; // Random failure for demo
            setVisuals(prev => prev.map((v, idx) =>
                idx === i ? {
                    ...v,
                    status: isFailed ? 'failed' : 'completed',
                    image_url: isFailed ? undefined : `https://picsum.photos/seed/${i}/400/400`,
                    error: isFailed ? 'Generation failed' : undefined,
                } : v
            ));

            setProgress(((i + 1) / initialVisuals.length) * 100);
        }
    }, []);

    const handleRetry = useCallback(async (index: number) => {
        setVisuals(prev => prev.map((v, i) =>
            i === index ? { ...v, status: 'processing' } : v
        ));
        await new Promise(resolve => setTimeout(resolve, 2000));
        setVisuals(prev => prev.map((v, i) =>
            i === index ? {
                ...v,
                status: 'completed',
                image_url: `https://picsum.photos/seed/retry-${index}/400/400`,
            } : v
        ));
    }, []);

    const handleDownload = useCallback(() => {
        alert('Download functionality - would trigger ZIP download of all completed visuals');
    }, []);

    const handleStartNew = useCallback(() => {
        setCurrentStep(1);
        setFrontImage(null);
        setBackImage(null);
        setReferenceImages([]);
        setProductAnalysis(mockProductAnalysis);
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
                    {selectedCollection
                        ? `Generating for: ${selectedCollection.name}`
                        : 'Upload product photos and generate AI visuals'
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