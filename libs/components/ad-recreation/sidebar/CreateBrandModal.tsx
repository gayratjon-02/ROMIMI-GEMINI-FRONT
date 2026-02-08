// libs/components/ad-recreation/sidebar/CreateBrandModal.tsx
import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createBrand, CreateBrandData, AdBrand } from '@/libs/server/Ad-Recreation/brand/brand.service';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

interface CreateBrandModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (newBrand: AdBrand) => void;
    isDarkMode?: boolean;
}

const CreateBrandModal: React.FC<CreateBrandModalProps> = ({
    isOpen,
    onClose,
    onCreated,
    isDarkMode = true,
}) => {
    const [name, setName] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!name.trim()) {
            setError('Brand name is required');
            return;
        }
        if (!websiteUrl.trim()) {
            setError('Website URL is required');
            return;
        }

        // URL validation
        try {
            new URL(websiteUrl);
        } catch {
            setError('Please enter a valid URL (e.g., https://example.com)');
            return;
        }

        setIsLoading(true);
        try {
            const brandData: CreateBrandData = {
                name: name.trim(),
                website_url: websiteUrl.trim(),
                description: description.trim() || undefined,
            };

            const newBrand = await createBrand(brandData);

            // Reset form
            setName('');
            setWebsiteUrl('');
            setDescription('');

            // Notify parent
            onCreated(newBrand);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create brand');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isLoading) {
            onClose();
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            <div className={`${styles.modalCard} ${!isDarkMode ? styles.light : ''}`}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Create Brand</h2>
                    <button
                        className={styles.modalCloseBtn}
                        onClick={onClose}
                        disabled={isLoading}
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    {error && (
                        <div className={styles.modalError}>
                            {error}
                        </div>
                    )}

                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>
                            Brand Name <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            className={styles.modalInput}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter brand name"
                            disabled={isLoading}
                            autoFocus
                        />
                    </div>

                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>
                            Website URL <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="url"
                            className={styles.modalInput}
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            placeholder="https://example.com"
                            disabled={isLoading}
                        />
                    </div>

                    <div className={styles.modalField}>
                        <label className={styles.modalLabel}>
                            Description <span className={styles.optional}>(optional)</span>
                        </label>
                        <textarea
                            className={styles.modalTextarea}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the brand..."
                            disabled={isLoading}
                            rows={3}
                        />
                    </div>

                    {/* Actions */}
                    <div className={styles.modalActions}>
                        <button
                            type="button"
                            className={styles.modalCancelBtn}
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={styles.modalSubmitBtn}
                            disabled={isLoading || !name.trim() || !websiteUrl.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className={styles.spinner} />
                                    Creating...
                                </>
                            ) : (
                                'Create Brand'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBrandModal;
