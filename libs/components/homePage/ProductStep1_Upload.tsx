'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, X, Plus } from 'lucide-react';
import styles from '@/scss/styles/HomePage/HomeMiddle.module.scss';

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
    const [dragStates, setDragStates] = React.useState({
        front: false,
        back: false,
        refs: false,
    });

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (type: 'front' | 'back' | 'refs') => (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragStates((prev) => ({ ...prev, [type]: false }));

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
                                <button
                                    className={styles.removeBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFrontImageChange(null);
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
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
                                <button
                                    className={styles.removeBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onBackImageChange(null);
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
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
