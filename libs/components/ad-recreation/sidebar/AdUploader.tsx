// libs/components/ad-recreation/sidebar/AdUploader.tsx
import React from 'react';
import { Upload, FileImage } from 'lucide-react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

interface AdUploaderProps {
    uploadedFile: string | null;
    onUpload: () => void;
    isDarkMode: boolean;
}

const AdUploader: React.FC<AdUploaderProps> = ({
    uploadedFile,
    onUpload,
    isDarkMode,
}) => {
    return (
        <div className={styles.section}>
            <label className={styles.sectionLabel}>Inspiration</label>
            <div
                className={`${styles.uploadZone} ${uploadedFile ? styles.hasFile : ''}`}
                onClick={onUpload}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onUpload()}
            >
                {uploadedFile ? (
                    <div className={styles.uploadedFile}>
                        <FileImage className={styles.fileIcon} size={20} />
                        <span className={styles.fileName}>{uploadedFile}</span>
                    </div>
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
