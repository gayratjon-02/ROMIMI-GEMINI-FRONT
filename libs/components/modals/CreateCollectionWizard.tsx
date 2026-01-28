'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material';
import {
    X,
    ArrowRight,
    ArrowLeft,
    Upload,
    Sparkles,
    Check,
    Image as ImageIcon,
    Loader2
} from 'lucide-react';
import styles from '@/scss/styles/Modals/CreateCollectionWizard.module.scss';
import { createCollection, updateDAJSON, analyzeDA } from '@/libs/server/HomePage/collection';
import { Collection } from '@/libs/types/homepage/collection';
import { AuthApiError } from '@/libs/components/types/config';
import { validateImageFile } from '@/libs/server/uploader/uploader';

interface CreateCollectionWizardProps {
    isOpen: boolean;
    onClose: () => void;
    brandId: string;
    brandName: string;
    onCollectionCreated?: (collection: Collection) => void;
}

interface FormData {
    name: string;
    code: string;
    description: string;
}

// Backend DA Response Interface
interface AnalyzedDAJSON {
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
    };
    camera: {
        focal_length_mm: number;
        aperture: number;
        focus: string;
    };
    quality: string;
    analyzed_at?: string;
}

// Slide animation variants
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0
    }),
    center: {
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 300 : -300,
        opacity: 0
    })
};

const CreateCollectionWizard: React.FC<CreateCollectionWizardProps> = ({
    isOpen,
    onClose,
    brandId,
    brandName,
    onCollectionCreated
}) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    // Wizard state
    const [currentStep, setCurrentStep] = useState(1);
    const [direction, setDirection] = useState(0);
    const [createdCollection, setCreatedCollection] = useState<Collection | null>(null);

    // Form state
    const [formData, setFormData] = useState<FormData>({
        name: '',
        code: '',
        description: ''
    });

    // Image state
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Analysis state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [daAnalysis, setDaAnalysis] = useState<AnalyzedDAJSON | null>(null);
    const [analysisProgress, setAnalysisProgress] = useState(0);

    // Submit state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);



    // Input refs for keyboard navigation
    const nameInputRef = useRef<HTMLInputElement>(null);
    const codeInputRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Drag state
    const [isDragging, setIsDragging] = useState(false);

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        if (error) setError(null);
    };

    // Handle DA Analysis input changes
    // Handle DA Analysis input changes (supports nested paths like 'background.description')
    const handleAnalysisChange = (path: string, value: any) => {
        if (!daAnalysis) return;

        // Deep clone to avoid mutation
        const newData = JSON.parse(JSON.stringify(daAnalysis));

        // Update nested property
        const parts = path.split('.');
        let current = newData;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
        }

        current[parts[parts.length - 1]] = value;
        setDaAnalysis(newData);
    };

    // Process dropped/selected file
    const processFile = useCallback((file: File) => {
        if (!file || !file.type.startsWith('image/')) return;

        // Validate file (30MB max to match backend)
        const validation = validateImageFile(file, 30);
        if (!validation.isValid) {
            setError(validation.error || 'Invalid file');
            return;
        }

        // Set local preview immediately
        setUploadedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);

        setError(null);
        // Note: Actual upload happens during analysis step
    }, []);

    // Handle image drop on drop zone
    const handleImageDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        processFile(file);
    }, [processFile]);

    // Handle file input change
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    // Handle click to open file picker
    const handleDropZoneClick = () => {
        fileInputRef.current?.click();
    };

    // Global drag-drop listeners (when modal is open and on step 2)
    useEffect(() => {
        if (!isOpen || currentStep !== 2 || isAnalyzing) return;

        const handleGlobalDragEnter = (e: DragEvent) => {
            e.preventDefault();
            if (e.dataTransfer?.types.includes('Files')) {
                setIsDragging(true);
            }
        };

        const handleGlobalDragLeave = (e: DragEvent) => {
            e.preventDefault();
            // Only set false if leaving the window
            if (e.relatedTarget === null) {
                setIsDragging(false);
            }
        };

        const handleGlobalDragOver = (e: DragEvent) => {
            e.preventDefault();
        };

        const handleGlobalDrop = (e: DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer?.files[0];
            if (file) {
                processFile(file);
            }
        };

        // Add global listeners
        document.addEventListener('dragenter', handleGlobalDragEnter);
        document.addEventListener('dragleave', handleGlobalDragLeave);
        document.addEventListener('dragover', handleGlobalDragOver);
        document.addEventListener('drop', handleGlobalDrop);

        return () => {
            document.removeEventListener('dragenter', handleGlobalDragEnter);
            document.removeEventListener('dragleave', handleGlobalDragLeave);
            document.removeEventListener('dragover', handleGlobalDragOver);
            document.removeEventListener('drop', handleGlobalDrop);
        };
    }, [isOpen, currentStep, isAnalyzing, processFile]);

    // Navigate steps
    const goToNextStep = () => {
        setDirection(1);
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };

    const goToPreviousStep = () => {
        setDirection(-1);
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // Step 1 Submit: Create Collection Draft
    const handleContinue = async () => {
        if (currentStep !== 1) {
            goToNextStep();
            return;
        }

        // If collection already created, just skip to next step
        if (createdCollection) {
            goToNextStep();
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const newCol = await createCollection({
                name: formData.name,
                code: formData.code,
                brand_id: brandId,
                description: formData.description || undefined
            });
            setCreatedCollection(newCol);
            goToNextStep();
        } catch (err) {
            if (err instanceof AuthApiError) setError(err.errors.join(', '));
            else setError('Failed to create collection');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step 2 Submit: AI Analysis
    const handleAnalyzeStyle = async () => {
        if (!createdCollection || !uploadedImage) return;

        setIsAnalyzing(true);
        setError(null);
        setAnalysisProgress(0);

        // Simulate realistic progress during API call
        const progressInterval = setInterval(() => {
            setAnalysisProgress(prev => {
                // Slow down as we get closer to 90%
                const increment = prev < 30 ? 8 : prev < 60 ? 4 : prev < 80 ? 2 : 0.5;
                return Math.min(prev + increment, 90);
            });
        }, 200);

        try {
            // Call API to analyze
            const result = await analyzeDA(createdCollection.id, uploadedImage);

            // Complete progress
            clearInterval(progressInterval);
            setAnalysisProgress(100);

            // Small delay to show 100% before transitioning
            await new Promise(resolve => setTimeout(resolve, 500));

            setDaAnalysis(result.analyzed_da_json);
            goToNextStep();
        } catch (err) {
            clearInterval(progressInterval);
            setAnalysisProgress(0);
            console.error('Analysis error:', err);
            if (err instanceof AuthApiError) setError(err.errors.join(', '));
            else setError('Failed to analyze style');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Step 3 Submit: Finalize Collection
    const handleFinish = async () => {
        if (!createdCollection || !daAnalysis) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const updated = await updateDAJSON(createdCollection.id, {
                analyzed_da_json: daAnalysis
            });

            const finalCollection = {
                ...createdCollection,
                analyzed_da_json: updated.analyzed_da_json,
                fixed_elements: updated.fixed_elements
            };

            console.log('Collection finalized:', finalCollection);

            if (onCollectionCreated) {
                onCollectionCreated(finalCollection);
            }

            handleClose();
        } catch (err) {
            if (err instanceof AuthApiError) {
                setError(err.errors.join(', '));
            } else {
                setError('Failed to finalize collection. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset and close
    const handleClose = () => {
        setCurrentStep(1);
        setDirection(0);
        setFormData({ name: '', code: '', description: '' });
        setUploadedImage(null);
        setImagePreview(null);
        setDaAnalysis(null);
        setError(null);
        onClose();
    };

    // Validation
    const isStep1Valid = formData.name.trim() !== '' && formData.code.trim() !== '';
    const isStep2Valid = uploadedImage !== null;

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <motion.div
                className={`${styles.modal} ${isDarkMode ? styles.dark : styles.light}`}
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
            >
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h2 className={styles.title}>Create Collection</h2>
                        <span className={styles.brandBadge}>{brandName}</span>
                    </div>
                    <button className={styles.closeBtn} onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className={styles.progressBar}>
                    {[1, 2, 3].map(step => (
                        <div
                            key={step}
                            className={`${styles.progressStep} ${currentStep >= step ? styles.active : ''} ${currentStep > step ? styles.completed : ''}`}
                        >
                            <div className={styles.stepCircle}>
                                {currentStep > step ? <Check size={14} /> : step}
                            </div>
                            <span className={styles.stepLabel}>
                                {step === 1 ? 'Basic Info' : step === 2 ? 'Visual Analysis' : 'Review'}
                            </span>
                        </div>
                    ))}
                    <div className={styles.progressLine}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className={styles.content}>
                    <AnimatePresence mode="wait" custom={direction}>
                        {/* Step 1: Basic Info */}
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className={styles.stepContent}
                            >
                                <div className={styles.stepHeader}>
                                    <h3>Collection Details</h3>
                                    <p>Enter the basic information for your new collection</p>
                                </div>

                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}>
                                        <label>Collection Name *</label>
                                        <input
                                            ref={nameInputRef}
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    codeInputRef.current?.focus();
                                                }
                                            }}
                                            placeholder="e.g., Spring Summer 2026"
                                            className={styles.input}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Collection Code *</label>
                                        <input
                                            ref={codeInputRef}
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    descriptionRef.current?.focus();
                                                }
                                            }}
                                            placeholder="e.g., SS26"
                                            className={styles.input}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Description (Optional)</label>
                                    <textarea
                                        ref={descriptionRef}
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                // Allow Shift+Enter for new lines, Enter alone goes to next step
                                                if (isStep1Valid) {
                                                    e.preventDefault();
                                                    handleContinue();
                                                }
                                            }
                                        }}
                                        placeholder="Describe the collection's vision and inspiration..."
                                        className={styles.textarea}
                                        rows={4}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Visual Analysis */}
                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className={styles.stepContent}
                            >
                                {!isAnalyzing ? (
                                    <>
                                        <div className={styles.stepHeader}>
                                            <h3>Direction Artistique</h3>
                                            <p>Upload a reference image to define the visual style</p>
                                        </div>

                                        <div
                                            className={`${styles.dropZone} ${imagePreview ? styles.hasImage : ''} ${isDragging ? styles.isDragging : ''}`}
                                            onDrop={handleImageDrop}
                                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onClick={!imagePreview ? handleDropZoneClick : undefined}
                                        >
                                            {imagePreview ? (
                                                <div className={styles.imagePreviewContainer}>
                                                    <img src={imagePreview} alt="DA Reference" className={styles.previewImage} />

                                                    {/* Upload Progress Overlay */}


                                                    {/* Upload Success Badge */}


                                                    <div className={styles.imageOverlay}>
                                                        <button
                                                            className={styles.changeImageBtn}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                fileInputRef.current?.click();
                                                            }}
                                                        >
                                                            Change Image
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={styles.dropContent}>
                                                    <div className={`${styles.uploadIconWrapper} ${isDragging ? styles.active : ''}`}>
                                                        <Upload size={32} />
                                                    </div>
                                                    <p className={styles.dropTitle}>
                                                        {isDragging ? 'Drop your image here!' : 'Drop your DA reference image here'}
                                                    </p>
                                                    <p className={styles.dropSubtitle}>or click to browse</p>
                                                    <p className={styles.dropHint}>Max file size: 15MB • JPG, PNG, WebP</p>
                                                </div>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                id="daImageInput"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageSelect}
                                                className={styles.hiddenInput}
                                            />
                                        </div>

                                        {/* Helper Warning */}
                                        <p className={styles.uploadWarning}>
                                            ⚠️ Upload an atmospheric reference (background/mood) only. Do not upload product shots here.
                                        </p>

                                        {/* Error Message */}
                                        {error && (
                                            <div className={styles.errorMessage}>{error}</div>
                                        )}
                                    </>
                                ) : (
                                    /* AI Analysis Loading State */
                                    <div className={styles.analyzingContainer}>
                                        <div className={styles.aiLoader}>
                                            <div className={styles.aiRing}>
                                                <div className={styles.aiRingInner} />
                                            </div>
                                            <Sparkles className={styles.aiIcon} size={32} />
                                        </div>
                                        <h3 className={styles.analyzingTitle}>Analyzing Visual Style</h3>
                                        <p className={styles.analyzingText}>
                                            Claude AI is extracting the visual atmosphere, lighting, and mood from your reference image...
                                        </p>
                                        <div className={styles.analyzeProgress}>
                                            <motion.div
                                                className={styles.analyzeProgressFill}
                                                style={{ width: `${analysisProgress}%` }}
                                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                            />
                                        </div>
                                        <p className={styles.progressText}>
                                            {analysisProgress < 30 && 'Loading reference image...'}
                                            {analysisProgress >= 30 && analysisProgress < 60 && 'Analyzing visual elements...'}
                                            {analysisProgress >= 60 && analysisProgress < 90 && 'Extracting lighting and mood...'}
                                            {analysisProgress >= 90 && 'Finalizing analysis...'}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Step 3: Review & Edit */}
                        {currentStep === 3 && daAnalysis && (
                            <motion.div
                                key="step3"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className={styles.stepContent}
                            >
                                <div className={styles.stepHeader}>
                                    <h3>Review & Edit Visual Direction</h3>
                                    <p>Fine-tune the AI-generated attributes for your collection</p>
                                </div>

                                {error && (
                                    <div className={styles.errorMessage}>{error}</div>
                                )}

                                <div className={styles.reviewLayout}>
                                    {/* Image Preview */}
                                    <div className={styles.reviewImageSection}>
                                        {imagePreview && (
                                            <img src={imagePreview} alt="DA Reference" className={styles.reviewImage} />
                                        )}
                                        <div className={styles.collectionInfo}>
                                            <h4>{formData.name}</h4>
                                            <span className={styles.codeTag}>{formData.code}</span>
                                        </div>
                                    </div>

                                    {/* Editable Fields - Organized by Section */}
                                    {daAnalysis && (
                                        <div className={styles.reviewFields}>
                                            {/* Background Section */}
                                            <div className={styles.sectionDivider}>
                                                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--wizard-text-primary)' }}>Background</h4>
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label>Background Color</label>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <div style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        borderRadius: '8px',
                                                        backgroundColor: daAnalysis.background?.color_hex || '#ffffff',
                                                        border: '2px solid var(--wizard-border)',
                                                        flexShrink: 0,
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                    }} />
                                                    <input
                                                        type="text"
                                                        value={daAnalysis.background?.color_hex || ''}
                                                        onChange={e => handleAnalysisChange('background.color_hex', e.target.value)}
                                                        className={styles.input}
                                                        placeholder="#HEXCODE"
                                                        style={{ width: '120px' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={daAnalysis.background?.color_name || ''}
                                                        onChange={e => handleAnalysisChange('background.color_name', e.target.value)}
                                                        className={styles.input}
                                                        placeholder="Color Name"
                                                        style={{ flex: 1 }}
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label>Background Description</label>
                                                <textarea
                                                    value={daAnalysis.background?.description || ''}
                                                    onChange={e => handleAnalysisChange('background.description', e.target.value)}
                                                    className={styles.textarea}
                                                    rows={2}
                                                    placeholder="e.g., Burgundy studio wall with soft texture"
                                                />
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label>Background Texture</label>
                                                <input
                                                    type="text"
                                                    value={daAnalysis.background?.texture || ''}
                                                    onChange={e => handleAnalysisChange('background.texture', e.target.value)}
                                                    className={styles.input}
                                                    placeholder="e.g., Concrete, Velvet, Seamless Paper"
                                                />
                                            </div>

                                            {/* Lighting Section */}
                                            <div className={styles.sectionDivider} style={{ marginTop: '24px' }}>
                                                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--wizard-text-primary)' }}>Lighting</h4>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <div className={styles.formGroup}>
                                                    <label>Type</label>
                                                    <input
                                                        type="text"
                                                        value={daAnalysis.lighting?.type || ''}
                                                        onChange={e => handleAnalysisChange('lighting.type', e.target.value)}
                                                        className={styles.input}
                                                        placeholder="e.g., Soft Natural"
                                                    />
                                                </div>

                                                <div className={styles.formGroup}>
                                                    <label>Direction</label>
                                                    <input
                                                        type="text"
                                                        value={daAnalysis.lighting?.direction || ''}
                                                        onChange={e => handleAnalysisChange('lighting.direction', e.target.value)}
                                                        className={styles.input}
                                                        placeholder="e.g., Front-lit"
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <div className={styles.formGroup}>
                                                    <label>Temperature</label>
                                                    <input
                                                        type="text"
                                                        value={daAnalysis.lighting?.temperature || ''}
                                                        onChange={e => handleAnalysisChange('lighting.temperature', e.target.value)}
                                                        className={styles.input}
                                                        placeholder="e.g., Warm 3000K"
                                                    />
                                                </div>

                                                <div className={styles.formGroup}>
                                                    <label>Intensity</label>
                                                    <input
                                                        type="text"
                                                        value={daAnalysis.lighting?.intensity || ''}
                                                        onChange={e => handleAnalysisChange('lighting.intensity', e.target.value)}
                                                        className={styles.input}
                                                        placeholder="e.g., Medium"
                                                    />
                                                </div>
                                            </div>

                                            {/* Props Section */}
                                            <div className={styles.sectionDivider} style={{ marginTop: '24px' }}>
                                                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--wizard-text-primary)' }}>Props & Styling</h4>
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label>Props Style</label>
                                                <textarea
                                                    value={daAnalysis.props?.style || ''}
                                                    onChange={e => handleAnalysisChange('props.style', e.target.value)}
                                                    className={styles.textarea}
                                                    rows={2}
                                                    placeholder="e.g., Playful romantic Valentine theme"
                                                />
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label>Props Placement</label>
                                                <input
                                                    type="text"
                                                    value={daAnalysis.props?.placement || ''}
                                                    onChange={e => handleAnalysisChange('props.placement', e.target.value)}
                                                    className={styles.input}
                                                    placeholder="e.g., Heart props on left and right sides"
                                                />
                                            </div>

                                            {/* Mood */}
                                            <div className={styles.sectionDivider} style={{ marginTop: '24px' }}>
                                                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--wizard-text-primary)' }}>Atmosphere</h4>
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label>Mood</label>
                                                <input
                                                    type="text"
                                                    value={daAnalysis.mood || ''}
                                                    onChange={e => handleAnalysisChange('mood', e.target.value)}
                                                    className={styles.input}
                                                    placeholder="e.g., Romantic, Playful, Minimalist"
                                                />
                                            </div>

                                            {/* Composition */}
                                            <div className={styles.formGroup}>
                                                <label>Composition Framing</label>
                                                <input
                                                    type="text"
                                                    value={daAnalysis.composition?.framing || ''}
                                                    onChange={e => handleAnalysisChange('composition.framing', e.target.value)}
                                                    className={styles.input}
                                                    placeholder="e.g., Medium shot, centered"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className={styles.footer}>
                    {currentStep > 1 && !isAnalyzing && (
                        <motion.button
                            className={styles.backBtn}
                            onClick={goToPreviousStep}
                            whileTap={{ scale: 0.97 }}
                        >
                            <ArrowLeft size={18} />
                            Back
                        </motion.button>
                    )}

                    <div className={styles.footerRight}>
                        {currentStep === 1 && (
                            <motion.button
                                className={`${styles.primaryBtn} ${(!isStep1Valid || isSubmitting) ? styles.disabled : ''}`}
                                onClick={handleContinue}
                                disabled={!isStep1Valid || isSubmitting}
                                whileTap={{ scale: 0.97 }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className={styles.spinner} />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </motion.button>
                        )}

                        {currentStep === 2 && !isAnalyzing && (
                            <motion.button
                                className={`${styles.analyzeBtn} ${(!isStep2Valid || isAnalyzing) ? styles.disabled : ''}`}
                                onClick={handleAnalyzeStyle}
                                disabled={!isStep2Valid || isAnalyzing}
                                whileTap={{ scale: 0.97 }}
                            >
                                <Sparkles size={18} />
                                Analyze Style
                            </motion.button>
                        )}

                        {currentStep === 3 && (
                            <motion.button
                                className={`${styles.createBtn} ${isSubmitting ? styles.loading : ''}`}
                                onClick={handleFinish}
                                disabled={isSubmitting}
                                whileTap={{ scale: 0.97 }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className={styles.spinner} />
                                        Finalizing...
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Done
                                    </>
                                )}
                            </motion.button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CreateCollectionWizard;
