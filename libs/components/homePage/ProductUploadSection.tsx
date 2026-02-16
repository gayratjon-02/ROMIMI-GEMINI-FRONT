'use client';

import React, { useState, useCallback, useRef } from 'react';
import styles from '@/scss/styles/HomePage/ProductUploadSection.module.scss';
import { Upload, Image as ImageIcon, X, Check, Loader2, Plus } from 'lucide-react';

interface ProductUploadSectionProps {
    isDarkMode?: boolean;
    frontImage: File | null;
    backImage: File | null;
    referenceImages?: File[];
    onFrontImageChange: (file: File | null) => void;
    onBackImageChange: (file: File | null) => void;
    onReferenceImagesChange?: (files: File[]) => void;
    onAnalyze: (forceReanalyze?: boolean) => void;
    isAnalyzing?: boolean;
    isAnalyzed?: boolean;
    frontImageUrl?: string | null;
    backImageUrl?: string | null;
}

const MAX_REFERENCE_IMAGES = 10;

const ProductUploadSection: React.FC<ProductUploadSectionProps> = ({
    isDarkMode = true,
    frontImage,
    backImage,
    referenceImages = [],
    onFrontImageChange,
    onBackImageChange,
    onReferenceImagesChange,
    onAnalyze,
    isAnalyzing = false,
    isAnalyzed = false,
    frontImageUrl = null,
    backImageUrl = null,
}) => {
    const [dragOverFront, setDragOverFront] = useState(false);
    const [dragOverBack, setDragOverBack] = useState(false);
    const [dragOverRef, setDragOverRef] = useState(false);
    const frontInputRef = useRef<HTMLInputElement>(null);
    const backInputRef = useRef<HTMLInputElement>(null);
    const refInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = useCallback((
        e: React.DragEvent,
        type: 'front' | 'back' | 'reference'
    ) => {
        e.preventDefault();
        setDragOverFront(false);
        setDragOverBack(false);
        setDragOverRef(false);

        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));

        if (type === 'front' && files[0]) {
            onFrontImageChange(files[0]);
        } else if (type === 'back' && files[0]) {
            onBackImageChange(files[0]);
        } else if (type === 'reference' && onReferenceImagesChange) {
            const newFiles = [...referenceImages, ...files].slice(0, MAX_REFERENCE_IMAGES);
            onReferenceImagesChange(newFiles);
        }
    }, [onFrontImageChange, onBackImageChange, onReferenceImagesChange, referenceImages]);

    const handleFileSelect = useCallback((
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'front' | 'back' | 'reference'
    ) => {
        const files = e.target.files ? Array.from(e.target.files) : [];

        if (type === 'front' && files[0]) {
            onFrontImageChange(files[0]);
        } else if (type === 'back' && files[0]) {
            onBackImageChange(files[0]);
        } else if (type === 'reference' && onReferenceImagesChange) {
            const newFiles = [...referenceImages, ...files].slice(0, MAX_REFERENCE_IMAGES);
            onReferenceImagesChange(newFiles);
        }

        // Reset input
        e.target.value = '';
    }, [onFrontImageChange, onBackImageChange, onReferenceImagesChange, referenceImages]);

    const removeReferenceImage = useCallback((index: number) => {
        if (onReferenceImagesChange) {
            const newFiles = referenceImages.filter((_, i) => i !== index);
            onReferenceImagesChange(newFiles);
        }
    }, [onReferenceImagesChange, referenceImages]);

    const renderUploadZone = (
        type: 'front' | 'back',
        image: File | null,
        isDragOver: boolean,
        inputRef: React.RefObject<HTMLInputElement | null>,
        imageUrl?: string | null,
    ) => {
        const preview = image ? URL.createObjectURL(image) : (imageUrl || null);

        return (
            <div className={styles.uploadZoneWrapper}>
                <label className={styles.uploadLabel}>
                    {type === 'front' ? 'FRONT' : 'BACK'}
                </label>
                <div
                    className={`${styles.uploadZone} ${isDragOver ? styles.dragOver : ''} ${(image || imageUrl) ? styles.hasImage : ''}`}
                    onDragOver={handleDragOver}
                    onDragEnter={() => type === 'front' ? setDragOverFront(true) : setDragOverBack(true)}
                    onDragLeave={() => type === 'front' ? setDragOverFront(false) : setDragOverBack(false)}
                    onDrop={(e) => handleDrop(e, type)}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, type)}
                        style={{ display: 'none' }}
                    />

                    {preview ? (
                        <>
                            <img src={preview} alt={`${type} preview`} className={styles.previewImage} />
                            <button
                                className={styles.removeBtn}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    type === 'front' ? onFrontImageChange(null) : onBackImageChange(null);
                                }}
                            >
                                <X size={14} />
                            </button>
                        </>
                    ) : (
                        <div className={styles.uploadPlaceholder}>
                            <ImageIcon size={24} />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Can analyze if at least one image is uploaded or selected from catalog
    const canAnalyze = (frontImage || backImage || frontImageUrl || backImageUrl) && !isAnalyzing;

    return (
        <div className={`${styles.container} ${isDarkMode ? styles.dark : styles.light}`}>
            <div className={styles.header}>
                <Upload size={16} />
                <span>Product Images</span>
                {isAnalyzed && <Check size={14} className={styles.checkIcon} />}
            </div>

            {/* Front & Back Images */}
            <div className={styles.uploadGrid}>
                {renderUploadZone('front', frontImage, dragOverFront, frontInputRef, frontImageUrl)}
                {renderUploadZone('back', backImage, dragOverBack, backInputRef, backImageUrl)}
            </div>

            {/* Reference Images Section */}
            {onReferenceImagesChange && (
                <div className={styles.referenceSection}>
                    <div className={styles.referenceHeader}>
                        <span>Reference Images</span>
                        <span className={styles.refCount}>{referenceImages.length}/{MAX_REFERENCE_IMAGES}</span>
                    </div>

                    <div className={styles.referenceGrid}>
                        {/* Existing reference images */}
                        {referenceImages.map((file, index) => (
                            <div key={index} className={styles.refImageWrapper}>
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Reference ${index + 1}`}
                                    className={styles.refImage}
                                />
                                <button
                                    className={styles.refRemoveBtn}
                                    onClick={() => removeReferenceImage(index)}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}

                        {/* Add more button */}
                        {referenceImages.length < MAX_REFERENCE_IMAGES && (
                            <div
                                className={`${styles.refAddBtn} ${dragOverRef ? styles.dragOver : ''}`}
                                onDragOver={handleDragOver}
                                onDragEnter={() => setDragOverRef(true)}
                                onDragLeave={() => setDragOverRef(false)}
                                onDrop={(e) => handleDrop(e, 'reference')}
                                onClick={() => refInputRef.current?.click()}
                            >
                                <Plus size={16} />
                                <input
                                    ref={refInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => handleFileSelect(e, 'reference')}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            <button
                className={`${styles.analyzeBtn} ${canAnalyze ? styles.ready : styles.disabled}`}
                onClick={() => onAnalyze(isAnalyzed)}
                disabled={!canAnalyze}
            >
                {isAnalyzing ? (
                    <>
                        <Loader2 size={16} className={styles.spin} />
                        Analyzing...
                    </>
                ) : isAnalyzed ? (
                    <>
                        <Check size={16} />
                        Analyzed
                    </>
                ) : (
                    <>
                        <Upload size={16} />
                        Analyze Product
                    </>
                )}
            </button>
        </div>
    );
};

export default ProductUploadSection;
