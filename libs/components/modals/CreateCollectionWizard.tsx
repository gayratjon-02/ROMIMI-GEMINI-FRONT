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
    Loader2,
    AlertCircle
} from 'lucide-react';
import styles from '@/scss/styles/Modals/CreateCollectionWizard.module.scss';
import { createCollection, updateDAJSON, analyzeDA } from '@/libs/server/HomePage/collection';
import { createBrand } from '@/libs/server/HomePage/brand';
import { Collection } from '@/libs/types/homepage/collection';
import { Brand } from '@/libs/types/homepage/brand';
import { AuthApiError } from '@/libs/components/types/config';
import { validateImageFile } from '@/libs/server/uploader/uploader';

interface CreateCollectionWizardProps {
    isOpen: boolean;
    onClose: () => void;
    brandId?: string;
    brandName?: string;
    onCollectionCreated?: (collection: Collection) => void;
    onBrandCreated?: (brand: Brand) => void;
    availableBrands?: Brand[];
}

interface FormData {
    brandName: string;
    name: string;
    code: string;
    description: string;
}

// Backend DA Response Interface
// MUST match backend AnalyzeDAPresetResponse structure
interface AnalyzedDAJSON {
    da_name?: string;
    background: {
        type: string;
        hex: string;
    };
    floor: {
        type: string;
        hex: string;
    };
    props: {
        left_side: string[];
        right_side: string[];
    };
    styling: {
        pants: string;
        footwear: string;
    };
    lighting: {
        type: string;
        temperature: string;
    };
    mood: string;
    quality: string;
}

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
    brandId: initialBrandId,
    brandName: initialBrandName,
    onCollectionCreated,
    onBrandCreated,
    availableBrands = []
}) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    // Wizard state
    // 1 = Input (Brand/Collection/Image)
    // 2 = Result (JSON Editor)
    const [currentStep, setCurrentStep] = useState(1);
    const [createdCollection, setCreatedCollection] = useState<Collection | null>(null);
    const [activeBrandId, setActiveBrandId] = useState<string | null>(initialBrandId || null);

    // Form state
    const [formData, setFormData] = useState<FormData>({
        brandName: initialBrandName || '',
        name: '',
        code: '',
        description: ''
    });

    // Update form if props change
    useEffect(() => {
        if (initialBrandName) {
            setFormData(prev => ({ ...prev, brandName: initialBrandName }));
            setActiveBrandId(initialBrandId || null);
        }
    }, [initialBrandName, initialBrandId]);

    // Image state
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Analysis state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [daAnalysis, setDaAnalysis] = useState<AnalyzedDAJSON | null>(null);
    const [analysisProgress, setAnalysisProgress] = useState(0);

    // JSON Editing State
    const [editedJson, setEditedJson] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Error state
    const [error, setError] = useState<string | null>(null);

    // Input refs
    const brandInputRef = useRef<HTMLInputElement>(null);
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

    // Step 1: Analyze Style
    const handleAnalyzeStyle = async () => {
        if (!uploadedImage) {
            setError("Please upload a reference image");
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setAnalysisProgress(0);

        // Progress simulation
        const progressInterval = setInterval(() => {
            setAnalysisProgress(prev => Math.min(prev + (prev < 30 ? 8 : prev < 60 ? 4 : 2), 90));
        }, 200);

        try {
            let targetBrandId = activeBrandId;

            // Brand creation logic
            if (!targetBrandId) {
                const brands = availableBrands || [];
                const existingBrand = brands.find(b => b.name.toLowerCase() === formData.brandName.trim().toLowerCase());

                if (existingBrand) {
                    targetBrandId = existingBrand.id;
                } else {
                    const newBrand = await createBrand({ name: formData.brandName.trim() });
                    targetBrandId = newBrand.id;
                    if (onBrandCreated) onBrandCreated(newBrand);
                }
                setActiveBrandId(targetBrandId);
            }

            if (!targetBrandId) throw new Error("Could not determine brand ID");

            // Create Collection if not exists (or recreated if canceled before)
            // But usually we just create it once.
            let collectionToUse = createdCollection;
            if (!collectionToUse) {
                const tempCollection = await createCollection({
                    name: formData.name,
                    code: formData.code,
                    brand_id: targetBrandId,
                    description: formData.description || undefined
                });
                setCreatedCollection(tempCollection);
                collectionToUse = tempCollection;
            }

            // Analyze
            const result = await analyzeDA(collectionToUse.id, uploadedImage);

            clearInterval(progressInterval);
            setAnalysisProgress(100);
            await new Promise(resolve => setTimeout(resolve, 500));

            const jsonString = JSON.stringify(result.analyzed_da_json, null, 2);
            setDaAnalysis(result.analyzed_da_json);
            setEditedJson(jsonString);

            // Move to JSON View
            setCurrentStep(2);

        } catch (err: any) {
            clearInterval(progressInterval);
            setAnalysisProgress(0);
            console.error('Analysis error:', err);
            setError(err.message || 'Failed to analyze style');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Step 2: Handle JSON Change
    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditedJson(e.target.value);
        setSaveSuccess(false);
    };

    // Step 2: Save JSON
    const handleSave = async () => {
        if (!createdCollection) return;

        try {
            const parsedJson = JSON.parse(editedJson);
            setIsSaving(true);
            setError(null);

            await updateDAJSON(createdCollection.id, {
                analyzed_da_json: parsedJson
            });

            setSaveSuccess(true);

            // Notify parent
            if (onCollectionCreated) {
                onCollectionCreated({
                    ...createdCollection,
                    analyzed_da_json: parsedJson
                });
            }

            // Close after delay
            setTimeout(() => {
                handleClose();
            }, 1000);

        } catch (err: any) {
            console.error('Save failed:', err);
            if (err instanceof SyntaxError) {
                setError('Invalid JSON format');
            } else {
                setError(err.message || 'Failed to save changes');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setCurrentStep(1);
        setEditedJson('');
        setSaveSuccess(false);
        setActiveBrandId(initialBrandId || null);
        setFormData({ brandName: initialBrandName || '', name: '', code: '', description: '' });
        setUploadedImage(null);
        setImagePreview(null);
        setDaAnalysis(null);
        setError(null);
        setCreatedCollection(null);
        onClose();
    };

    // Validation
    const isStep1Valid = formData.name.trim() !== '' && formData.code.trim() !== '' && (!!activeBrandId || formData.brandName.trim() !== '');

    if (!isOpen) return null;

    return (
        <div className={`${styles.overlay} ${isDarkMode ? styles.dark : styles.light}`} onClick={handleClose}>
            <motion.div
                className={`${styles.modal} ${isDarkMode ? styles.dark : styles.light}`}
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
            >
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h2 className={styles.title}>
                            {currentStep === 1 ? (activeBrandId ? 'Create Collection' : 'Create DA') : 'Review & Save'}
                        </h2>
                        {currentStep === 1 && (
                            <span className={styles.brandBadge}>
                                {activeBrandId
                                    ? (availableBrands.find(b => b.id === activeBrandId)?.name || formData.brandName)
                                    : (formData.brandName || 'New Brand')}
                            </span>
                        )}
                    </div>
                    <button className={styles.closeBtn} onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    <AnimatePresence mode='wait'>
                        {/* Step 1: Inputs & Upload */}
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.formGrid}>
                                    {/* Brand Name */}
                                    {!activeBrandId && (
                                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                            <label>Brand Name *</label>
                                            <input
                                                ref={brandInputRef}
                                                name="brandName"
                                                value={formData.brandName}
                                                onChange={handleInputChange}
                                                placeholder="e.g., My Fashion Brand"
                                                className={styles.input}
                                                autoFocus
                                            />
                                        </div>
                                    )}
                                    <div className={styles.formGroup}>
                                        <label>Collection Name *</label>
                                        <input
                                            ref={nameInputRef}
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Spring Summer 2026"
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Collection Code *</label>
                                        <input
                                            ref={codeInputRef}
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            placeholder="e.g., SS26"
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                        <label>Description (Optional)</label>
                                        <textarea
                                            ref={descriptionRef}
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Describe the collection's vision..."
                                            className={styles.textarea}
                                            rows={2}
                                        />
                                    </div>
                                </div>

                                {/* Image Upload Component */}
                                {isAnalyzing ? (
                                    <div className={styles.analyzingContainer}>
                                        <div className={styles.aiLoader}>
                                            <div className={styles.aiRing}><div className={styles.aiRingInner}></div></div>
                                            <Sparkles className={styles.aiIcon} size={24} />
                                        </div>
                                        <div className={styles.analyzingTitle}>Analyzing Style DNA</div>
                                        <p className={styles.analyzingText}>Extracting aesthetic elements...</p>
                                        <div className={styles.analyzeProgress}>
                                            <div className={styles.analyzeProgressFill} style={{ width: `${analysisProgress}%` }} />
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className={`${styles.dropZone} ${isDragging ? styles.isDragging : ''} ${uploadedImage ? styles.hasImage : ''}`}
                                        onClick={handleDropZoneClick}
                                        onDrop={handleImageDrop}
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className={styles.hiddenInput}
                                            onChange={handleImageSelect}
                                            accept="image/*"
                                        />

                                        {imagePreview ? (
                                            <div className={styles.imagePreviewContainer}>
                                                <img src={imagePreview} alt="Preview" className={styles.previewImage} />
                                                <div className={styles.imageOverlay}>
                                                    <button className={styles.changeImageBtn}>Change Image</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={styles.dropContent}>
                                                <div className={styles.uploadIconWrapper}>
                                                    <Upload size={32} />
                                                </div>
                                                <h3 className={styles.dropTitle}>Upload Reference Image</h3>
                                                <p className={styles.dropSubtitle}>Drag & drop or click to browse</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Step 2: JSON Result */}
                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.jsonContainer}>
                                    {saveSuccess && (
                                        <div className={styles.successMessage}>
                                            <Check size={16} /> Changes saved successfully!
                                        </div>
                                    )}
                                    <textarea
                                        className={styles.jsonEditor}
                                        value={editedJson}
                                        onChange={handleJsonChange}
                                        spellCheck={false}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <div className={styles.errorMessage}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    {currentStep === 1 ? (
                        <button
                            className={styles.primaryBtn}
                            onClick={handleAnalyzeStyle}
                            disabled={isAnalyzing || !formData.name || !formData.code || !uploadedImage}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            {isAnalyzing ? 'Analyzing...' : 'Analyze Style'}
                            {!isAnalyzing && <Sparkles size={16} style={{ marginLeft: 8 }} />}
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                            <button className={styles.secondaryBtn} onClick={handleClose} disabled={isSaving}>
                                Close
                            </button>
                            <button
                                className={styles.primaryBtn}
                                onClick={handleSave}
                                disabled={isSaving}
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                {isSaving ? <Loader2 size={16} className={styles.spin} /> : <Check size={16} />}
                                <span style={{ marginLeft: 8 }}>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default CreateCollectionWizard;
