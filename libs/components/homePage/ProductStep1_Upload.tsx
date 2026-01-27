'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, X, Plus, CheckCircle } from 'lucide-react';
import styles from '@/scss/styles/HomePage/HomeMiddle.module.scss';

// Fayl hajmini formatlash uchun helper
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Maksimal rasm hajmi (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface ProductStep1Props {
    frontImage: File | null;
    backImage: File | null;
    referenceImages: File[];
    onFrontImageChange: (file: File | null) => void;
    onBackImageChange: (file: File | null) => void;
    onReferenceImagesChange: (files: File[]) => void;
    onNext: () => void;
    isAnalyzing: boolean;
}

const ProductStep1_Upload: React.FC<ProductStep1Props> = ({
    frontImage,
    backImage,
    referenceImages,
    onFrontImageChange,
    onBackImageChange,
    onReferenceImagesChange,
    onNext,
    isAnalyzing,
}) => {
    const [dragStates, setDragStates] = useState({
        front: false,
        back: false,
        refs: false,
    });

    // Global drag holati - butun sahifaga rasm olib kelganda ko'rinadi
    const [isGlobalDragging, setIsGlobalDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    // GLOBAL DROP - tashqaridan rasm olib kelganda tartib bilan joylaydi
    const handleGlobalDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsGlobalDragging(false);
            setDragStates({ front: false, back: false, refs: false });

            const files = Array.from(e.dataTransfer.files).filter((file) =>
                file.type.startsWith('image/')
            );

            if (files.length === 0) return;

            let fileIndex = 0;

            // 1. Front View - bo'sh bo'lsa birinchi rasmni joylaymiz
            if (!frontImage && files[fileIndex]) {
                onFrontImageChange(files[fileIndex]);
                fileIndex++;
            }

            // 2. Back View - bo'sh bo'lsa keyingi rasmni joylaymiz
            if (!backImage && files[fileIndex]) {
                onBackImageChange(files[fileIndex]);
                fileIndex++;
            }

            // 3. Qolgan rasmlar - Detail References-ga (max 4)
            if (fileIndex < files.length) {
                const remainingFiles = files.slice(fileIndex);
                const newRefs = [...referenceImages, ...remainingFiles].slice(0, 4);
                onReferenceImagesChange(newRefs);
            }
        },
        [frontImage, backImage, referenceImages, onFrontImageChange, onBackImageChange, onReferenceImagesChange]
    );

    // Global drag enter/leave
    const handleGlobalDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsGlobalDragging(true);
    }, []);

    const handleGlobalDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        // Faqat komponentdan chiqsa
        if (e.currentTarget === e.target) {
            setIsGlobalDragging(false);
        }
    }, []);

    const handleDrop = useCallback(
        (type: 'front' | 'back' | 'refs') => (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragStates((prev) => ({ ...prev, [type]: false }));
            setIsGlobalDragging(false);

            const files = Array.from(e.dataTransfer.files).filter((file) =>
                file.type.startsWith('image/')
            );

            if (type === 'front' && files[0]) {
                onFrontImageChange(files[0]);
            } else if (type === 'back' && files[0]) {
                onBackImageChange(files[0]);
            } else if (type === 'refs') {
                onReferenceImagesChange([...referenceImages, ...files].slice(0, 4));
            }
        },
        [onFrontImageChange, onBackImageChange, onReferenceImagesChange, referenceImages]
    );

    const handleFileSelect = useCallback(
        (type: 'front' | 'back' | 'refs') => (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || []);
            if (type === 'front' && files[0]) {
                onFrontImageChange(files[0]);
            } else if (type === 'back' && files[0]) {
                onBackImageChange(files[0]);
            } else if (type === 'refs') {
                onReferenceImagesChange([...referenceImages, ...files].slice(0, 4));
            }
            e.target.value = '';
        },
        [onFrontImageChange, onBackImageChange, onReferenceImagesChange, referenceImages]
    );

    const removeRefImage = (index: number) => {
        onReferenceImagesChange(referenceImages.filter((_, i) => i !== index));
    };

    const canProceed = frontImage && backImage;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className={`${styles.stepContentWrapper} ${isGlobalDragging ? styles.globalDragging : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={handleGlobalDragEnter}
            onDragLeave={handleGlobalDragLeave}
            onDrop={handleGlobalDrop}
        >
            {/* Main Dropzones Grid */}
            <div className={styles.dropzoneGrid}>
                {/* Front Image Dropzone */}
                <div
                    className={`${styles.dropzone} ${styles.required} ${dragStates.front ? styles.dragging : ''} ${frontImage ? styles.hasImage : ''}`}
                    onDragOver={handleDragOver}
                    onDragEnter={() => setDragStates((prev) => ({ ...prev, front: true }))}
                    onDragLeave={() => setDragStates((prev) => ({ ...prev, front: false }))}
                    onDrop={handleDrop('front')}
                    onClick={() => document.getElementById('front-input')?.click()}
                >
                    {frontImage ? (
                        <>
                            <img
                                src={URL.createObjectURL(frontImage)}
                                alt="Front view"
                                className={styles.dropzonePreview}
                            />
                            <div className={styles.dropzoneOverlay}>
                                <div className={styles.fileInfo}>
                                    <CheckCircle size={20} style={{ color: '#10b981' }} />
                                    <span className={styles.fileName}>{frontImage.name}</span>
                                    <span className={styles.fileSize}>{formatFileSize(frontImage.size)}</span>
                                </div>
                                <button
                                    className={styles.removeBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFrontImageChange(null);
                                    }}
                                >
                                    <X size={14} />
                                    O'chirish
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <span className={styles.requiredBadge}>REQUIRED</span>
                            <div className={styles.dropzoneIcon}>
                                <ImageIcon size={24} />
                            </div>
                            <h4 className={styles.dropzoneTitle}>Front View</h4>
                            <p className={styles.dropzoneSubtitle}>
                                Drag & drop or click to upload
                            </p>
                        </>
                    )}
                    <input
                        id="front-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect('front')}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Back Image Dropzone */}
                <div
                    className={`${styles.dropzone} ${styles.required} ${dragStates.back ? styles.dragging : ''} ${backImage ? styles.hasImage : ''}`}
                    onDragOver={handleDragOver}
                    onDragEnter={() => setDragStates((prev) => ({ ...prev, back: true }))}
                    onDragLeave={() => setDragStates((prev) => ({ ...prev, back: false }))}
                    onDrop={handleDrop('back')}
                    onClick={() => document.getElementById('back-input')?.click()}
                >
                    {backImage ? (
                        <>
                            <img
                                src={URL.createObjectURL(backImage)}
                                alt="Back view"
                                className={styles.dropzonePreview}
                            />
                            <div className={styles.dropzoneOverlay}>
                                <div className={styles.fileInfo}>
                                    <CheckCircle size={20} style={{ color: '#10b981' }} />
                                    <span className={styles.fileName}>{backImage.name}</span>
                                    <span className={styles.fileSize}>{formatFileSize(backImage.size)}</span>
                                </div>
                                <button
                                    className={styles.removeBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onBackImageChange(null);
                                    }}
                                >
                                    <X size={14} />
                                    O'chirish
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <span className={styles.requiredBadge}>REQUIRED</span>
                            <div className={styles.dropzoneIcon}>
                                <ImageIcon size={24} />
                            </div>
                            <h4 className={styles.dropzoneTitle}>Back View</h4>
                            <p className={styles.dropzoneSubtitle}>
                                Drag & drop or click to upload
                            </p>
                        </>
                    )}
                    <input
                        id="back-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect('back')}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>

            {/* Reference Images Section */}
            <div className={styles.referenceSection}>
                <h4 className={styles.sectionTitle}>
                    Detail References
                    <span className={styles.optional}>(Optional - Logos, Fabric, etc.)</span>
                </h4>
                <div className={styles.referenceGrid}>
                    {referenceImages.map((file, index) => (
                        <div key={index} className={`${styles.referenceDropzone} ${styles.hasImage}`}>
                            <img
                                src={URL.createObjectURL(file)}
                                alt={`Reference ${index + 1}`}
                                className={styles.dropzonePreview}
                            />
                            <div className={styles.dropzoneOverlay}>
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => removeRefImage(index)}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {referenceImages.length < 4 && (
                        <div
                            className={styles.referenceDropzone}
                            onDragOver={handleDragOver}
                            onDragEnter={() => setDragStates((prev) => ({ ...prev, refs: true }))}
                            onDragLeave={() => setDragStates((prev) => ({ ...prev, refs: false }))}
                            onDrop={handleDrop('refs')}
                            onClick={() => document.getElementById('refs-input')?.click()}
                        >
                            <Plus size={24} style={{ color: 'var(--wizard-text-muted)' }} />
                            <input
                                id="refs-input"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect('refs')}
                                style={{ display: 'none' }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Action Bar */}
            <div className={styles.actionBar}>
                <div />
                <button
                    className={styles.btnPrimary}
                    onClick={onNext}
                    disabled={!canProceed || isAnalyzing}
                >
                    {isAnalyzing ? (
                        <>
                            <span className={styles.loadingSpinner} style={{ width: 18, height: 18 }} />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            Analyze Product
                            <Upload size={18} />
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
};

export default ProductStep1_Upload;
