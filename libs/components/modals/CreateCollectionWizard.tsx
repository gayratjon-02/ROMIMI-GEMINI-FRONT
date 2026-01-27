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
import { createCollection } from '@/libs/server/HomePage/collection';
import { Collection } from '@/libs/types/homepage/collection';
import { AuthApiError } from '@/libs/components/types/config';
import { uploadDAImage, validateImageFile } from '@/libs/server/uploader/uploader';
import { UploadProgress } from '@/libs/types/uploader/uploader.input';

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

interface DAAnalysis {
    background: string;
    lighting: string;
    composition: string;
    props_decor: string;
    mood: string;
    color_palette: string[];
}

// Mock AI Analysis Response
const mockDAAnalysis: DAAnalysis = {
    background: "Clean white cyclorama with soft natural shadows, creating an infinite horizon effect",
    lighting: "Soft diffused daylight from large windows, warm golden hour tones with minimal harsh shadows",
    composition: "Editorial centered portrait, depth of field focused on foreground, rule of thirds framing",
    props_decor: "Minimalist wooden stool, dried pampas grass arrangement, neutral linen fabric draping",
    mood: "Serene, sophisticated, effortlessly elegant with a touch of Scandinavian simplicity",
    color_palette: ["#F5F5F0", "#E8E4DF", "#D4C8BE", "#A69B8D", "#7A6F63"]
};

// Helper function to convert hex to approximate color name
const hexToColorName = (hex: string): string => {
    const colorNames: Record<string, string> = {
        '#F5F5F0': 'Ivory',
        '#E8E4DF': 'Linen',
        '#D4C8BE': 'Soft Taupe',
        '#A69B8D': 'Warm Gray',
        '#7A6F63': 'Dark Taupe',
        '#FFFFFF': 'White',
        '#000000': 'Black',
        '#F5F5DC': 'Beige',
        '#87CEEB': 'Sky Blue',
        '#90EE90': 'Light Green',
        '#2C2C2C': 'Charcoal',
        '#8B4513': 'Saddle Brown',
        '#DAA520': 'Goldenrod',
        '#0A0A0A': 'Near Black',
        '#8B0000': 'Dark Red',
        '#1A1A1A': 'Jet Black',
        '#C41E3A': 'Cardinal Red',
        '#808080': 'Gray',
        '#FF6B6B': 'Coral Red',
        '#4ECDC4': 'Turquoise',
        '#2C3E50': 'Dark Slate',
        '#A3B18A': 'Sage Green',
        '#588157': 'Fern Green',
        '#DAD7CD': 'Pale Silver',
        '#3A5A40': 'Hunter Green',
        '#722F37': 'Wine',
        '#D4AF37': 'Metallic Gold',
        '#1C1C1C': 'Eerie Black',
        '#F8F8FF': 'Ghost White',
        '#F5DEB3': 'Wheat',
        '#DEB887': 'Burlywood',
    };

    // Check exact match first
    const upperHex = hex.toUpperCase();
    if (colorNames[upperHex]) {
        return colorNames[upperHex];
    }

    // If no exact match, analyze the color
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const lightness = (r + g + b) / 3;

    if (lightness > 240) return 'Off White';
    if (lightness > 200) return 'Light Gray';
    if (lightness > 150) return 'Medium Gray';
    if (lightness > 100) return 'Dark Gray';
    if (lightness > 50) return 'Charcoal';
    return 'Near Black';
};

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
    const [daAnalysis, setDaAnalysis] = useState<DAAnalysis | null>(null);

    // Submit state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

    // Input refs for keyboard navigation
    const nameInputRef = useRef<HTMLInputElement>(null);
    const codeInputRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Drag state
    const [isDragging, setIsDragging] = useState(false);

    // Color palette names (editable by user)
    const [colorPaletteNames, setColorPaletteNames] = useState<string>('');

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        if (error) setError(null);
    };

    // Handle DA Analysis input changes
    const handleAnalysisChange = (field: keyof DAAnalysis, value: string) => {
        if (daAnalysis) {
            setDaAnalysis(prev => prev ? { ...prev, [field]: value } : null);
        }
    };

    // Process dropped/selected file - upload to server
    const processFile = useCallback(async (file: File) => {
        if (!file || !file.type.startsWith('image/')) return;

        // Validate file
        const validation = validateImageFile(file, 10);
        if (!validation.isValid) {
            setError(validation.error || 'Invalid file');
            return;
        }

        // Set local preview immediately
        setUploadedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);

        // Upload to server
        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            const imageUrl = await uploadDAImage(file, (progress) => {
                setUploadProgress(progress.percentage);
            });
            setUploadedImageUrl(imageUrl);
            console.log('DA Image uploaded:', imageUrl);
        } catch (err) {
            console.error('Upload error:', err);
            if (err instanceof AuthApiError) {
                setError(err.errors.join(', '));
            } else {
                setError('Failed to upload image. Please try again.');
            }
            // Keep local preview even if upload fails
        } finally {
            setIsUploading(false);
        }
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

    // AI Analysis (Mock)
    const handleAnalyzeStyle = async () => {
        setIsAnalyzing(true);

        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 2500));

        setDaAnalysis(mockDAAnalysis);
        setIsAnalyzing(false);
        goToNextStep();
    };

    // Submit collection
    const handleCreateCollection = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const newCollection = await createCollection({
                name: formData.name,
                code: formData.code,
                brand_id: brandId,
                description: formData.description || undefined
            });

            console.log('Collection created:', newCollection);

            if (onCollectionCreated) {
                onCollectionCreated(newCollection);
            }

            handleClose();
        } catch (err) {
            if (err instanceof AuthApiError) {
                setError(err.errors.join(', '));
            } else {
                setError('Failed to create collection. Please try again.');
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
                                                    goToNextStep();
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
                                                    {isUploading && (
                                                        <div className={styles.uploadProgressOverlay}>
                                                            <div className={styles.uploadProgressContent}>
                                                                <Loader2 size={24} className={styles.spinner} />
                                                                <p>Uploading... {uploadProgress}%</p>
                                                                <div className={styles.uploadProgressBar}>
                                                                    <div
                                                                        className={styles.uploadProgressFill}
                                                                        style={{ width: `${uploadProgress}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Upload Success Badge */}
                                                    {!isUploading && uploadedImageUrl && (
                                                        <div className={styles.uploadSuccessBadge}>
                                                            <Check size={14} />
                                                            Uploaded
                                                        </div>
                                                    )}

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
                                                initial={{ width: '0%' }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 2.5, ease: 'linear' }}
                                            />
                                        </div>
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
                                    <h3>Review & Edit</h3>
                                    <p>Fine-tune the AI-generated visual direction</p>
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

                                    {/* Editable Fields */}
                                    <div className={styles.reviewFields}>
                                        <div className={styles.formGroup}>
                                            <label>Background</label>
                                            <textarea
                                                value={daAnalysis.background}
                                                onChange={e => handleAnalysisChange('background', e.target.value)}
                                                className={styles.textarea}
                                                rows={2}
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label>Lighting</label>
                                            <input
                                                type="text"
                                                value={daAnalysis.lighting}
                                                onChange={e => handleAnalysisChange('lighting', e.target.value)}
                                                className={styles.input}
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label>Composition</label>
                                            <textarea
                                                value={daAnalysis.composition}
                                                onChange={e => handleAnalysisChange('composition', e.target.value)}
                                                className={styles.textarea}
                                                rows={2}
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label>Props & Decor</label>
                                            <textarea
                                                value={daAnalysis.props_decor}
                                                onChange={e => handleAnalysisChange('props_decor', e.target.value)}
                                                className={styles.textarea}
                                                rows={2}
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label>Mood</label>
                                            <input
                                                type="text"
                                                value={daAnalysis.mood}
                                                onChange={e => handleAnalysisChange('mood', e.target.value)}
                                                className={styles.input}
                                            />
                                        </div>

                                        {/* Color Palette */}
                                        <div className={styles.colorPalette}>
                                            <label>Color Palette</label>
                                            <div className={styles.colorSwatches}>
                                                {daAnalysis.color_palette.map((color, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={styles.colorSwatch}
                                                        style={{ backgroundColor: color }}
                                                        title={`${hexToColorName(color)} (${color})`}
                                                    />
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                value={colorPaletteNames || daAnalysis.color_palette.map(c => hexToColorName(c)).join(', ')}
                                                onChange={(e) => setColorPaletteNames(e.target.value)}
                                                className={styles.colorNamesInput}
                                                placeholder="Describe your color palette..."
                                            />
                                        </div>
                                    </div>
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
                                className={`${styles.primaryBtn} ${!isStep1Valid ? styles.disabled : ''}`}
                                onClick={goToNextStep}
                                disabled={!isStep1Valid}
                                whileTap={{ scale: 0.97 }}
                            >
                                Continue
                                <ArrowRight size={18} />
                            </motion.button>
                        )}

                        {currentStep === 2 && !isAnalyzing && (
                            <motion.button
                                className={`${styles.analyzeBtn} ${!isStep2Valid ? styles.disabled : ''}`}
                                onClick={handleAnalyzeStyle}
                                disabled={!isStep2Valid}
                                whileTap={{ scale: 0.97 }}
                            >
                                <Sparkles size={18} />
                                Analyze Style
                            </motion.button>
                        )}

                        {currentStep === 3 && (
                            <motion.button
                                className={`${styles.createBtn} ${isSubmitting ? styles.loading : ''}`}
                                onClick={handleCreateCollection}
                                disabled={isSubmitting}
                                whileTap={{ scale: 0.97 }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className={styles.spinner} />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Create Collection
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
