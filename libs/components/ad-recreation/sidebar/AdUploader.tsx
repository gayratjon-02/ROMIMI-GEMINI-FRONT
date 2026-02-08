// libs/components/ad-recreation/sidebar/AdUploader.tsx
import React, { useRef, useState, useCallback } from 'react';
import { Upload, FileImage, Loader2, AlertCircle, X } from 'lucide-react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';
import { uploadInspirationImage, UploadResult } from '@/libs/server/Ad-Recreation/inspiration/inspiration.service';

interface AdUploaderProps {
    onUploadSuccess: (data: UploadResult) => void;
    isDarkMode: boolean;
}

const AdUploader: React.FC<AdUploaderProps> = ({
    onUploadSuccess,
    isDarkMode,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileUpload = useCallback(async (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('File size must be less than 10MB');
            return;
        }

        setError(null);
        setIsUploading(true);
        setUploadedFileName(file.name);

        // Create preview URL
        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);

        try {
            const result = await uploadInspirationImage(file);

            // Call parent callback with the results
            onUploadSuccess(result);

        } catch (err) {
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
            setUploadedFileName(null);
            setPreviewUrl(null);
        } finally {
            setIsUploading(false);
        }
    }, [onUploadSuccess]);

    const handleClick = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
        // Reset input value to allow re-uploading same file
        e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setUploadedFileName(null);
        setPreviewUrl(null);
        setError(null);
    };

    return (
        <div className={styles.section}>
            <label className={styles.sectionLabel}>Inspiration</label>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            <div
                className={`${styles.uploadZone} ${uploadedFileName ? styles.hasFile : ''} ${isDragOver ? styles.dragOver : ''}`}
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleClick()}
                style={{
                    cursor: isUploading ? 'wait' : 'pointer',
                    borderColor: isDragOver ? '#4f46e5' : undefined,
                }}
            >
                {isUploading ? (
                    <div className={styles.uploadingState}>
                        <Loader2 className={styles.spinner} size={32} />
                        <p className={styles.uploadText}>Analyzing image...</p>
                        <p className={styles.uploadHint}>{uploadedFileName}</p>
                    </div>
                ) : uploadedFileName && !error ? (
                    <div className={styles.uploadedFile}>
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Preview"
                                style={{
                                    width: 48,
                                    height: 48,
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                }}
                            />
                        ) : (
                            <FileImage size={24} />
                        )}
                        <div style={{ flex: 1, textAlign: 'left' }}>
                            <span className={styles.fileName}>{uploadedFileName}</span>
                            <span style={{ fontSize: 11, opacity: 0.6, display: 'block' }}>
                                ✓ Analyzed
                            </span>
                        </div>
                        <button
                            onClick={handleClear}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'inherit',
                                cursor: 'pointer',
                                padding: 4,
                                opacity: 0.6,
                            }}
                            title="Clear upload"
                            type="button"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : error ? (
                    <>
                        <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: 8 }} />
                        <p className={styles.uploadText} style={{ color: '#ef4444' }}>{error}</p>
                        <p className={styles.uploadHint}>Click to try again</p>
                    </>
                ) : (
                    <>
                        <Upload className={styles.uploadIcon} size={40} />
                        <p className={styles.uploadText}>Drop competitor ad here</p>
                        <p className={styles.uploadHint}>or click to browse</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdUploader;
