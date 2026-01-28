'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import { Collection } from '@/libs/types/homepage/collection';
import { updateCollection, updateDAJSON } from '@/libs/server/HomePage/collection';
import { AuthApiError } from '@/libs/server/HomePage/signup';
import { AnalyzedDAJSON } from '@/libs/types/homepage/analyzed-da-json';
import styles from '@/scss/styles/HomePage/CreateCollectionWizard.module.scss';

interface EditCollectionModalProps {
    collection: Collection;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedCollection: Collection) => void;
    isDarkMode?: boolean;
}

const EditCollectionModal: React.FC<EditCollectionModalProps> = ({
    collection,
    isOpen,
    onClose,
    onSave,
    isDarkMode = true
}) => {
    const [formData, setFormData] = useState({
        name: collection.name,
        code: collection.code || '',
        description: collection.description || ''
    });

    const [daAnalysis, setDaAnalysis] = useState<AnalyzedDAJSON | null>(
        collection.analyzed_da_json || null
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when collection changes
    useEffect(() => {
        setFormData({
            name: collection.name,
            code: collection.code || '',
            description: collection.description || ''
        });
        setDaAnalysis(collection.analyzed_da_json || null);
    }, [collection]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAnalysisChange = (path: string, value: any) => {
        if (!daAnalysis) return;

        setDaAnalysis(prev => {
            if (!prev) return prev;
            const newAnalysis = { ...prev };
            const keys = path.split('.');

            if (keys.length === 1) {
                // Top-level property (e.g., 'mood')
                (newAnalysis as any)[keys[0]] = value;
            } else if (keys.length === 2) {
                // Nested property (e.g., 'background.color_hex')
                const [parent, child] = keys;
                if (newAnalysis[parent as keyof AnalyzedDAJSON]) {
                    (newAnalysis[parent as keyof AnalyzedDAJSON] as any)[child] = value;
                }
            }

            return newAnalysis;
        });
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setError('Collection name is required');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Update basic collection info
            const updatedBasic = await updateCollection(collection.id, {
                name: formData.name.trim(),
                description: formData.description?.trim() || undefined
            });

            // Update DA JSON if exists
            let finalCollection = updatedBasic;
            if (daAnalysis) {
                const updatedDA = await updateDAJSON(collection.id, {
                    analyzed_da_json: daAnalysis
                });
                finalCollection = {
                    ...updatedBasic,
                    analyzed_da_json: updatedDA.analyzed_da_json,
                    fixed_elements: updatedDA.fixed_elements
                };
            }

            onSave(finalCollection);
            onClose();
        } catch (err) {
            if (err instanceof AuthApiError) {
                setError(err.errors.join(', '));
            } else {
                setError('Failed to update collection. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <motion.div
                className={`${styles.modal} ${isDarkMode ? styles.dark : styles.light}`}
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}
            >
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h2 className={styles.title}>Edit Collection</h2>
                        <span className={styles.brandBadge}>{formData.code}</span>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content} style={{ padding: '24px' }}>
                    {error && (
                        <div className={styles.errorMessage}>{error}</div>
                    )}

                    <div className={styles.reviewLayout}>
                        {/* Left: Image Preview */}
                        <div className={styles.reviewImageSection}>
                            {collection.da_reference_image_url && (
                                <img
                                    src={collection.da_reference_image_url}
                                    alt="DA Reference"
                                    className={styles.reviewImage}
                                />
                            )}
                            <div className={styles.collectionInfo}>
                                <h4>{formData.name}</h4>
                                <span className={styles.codeTag}>{formData.code}</span>
                            </div>
                        </div>

                        {/* Right: Editable Fields */}
                        <div className={styles.reviewFields}>
                            {/* Basic Info Section */}
                            <div className={styles.sectionDivider}>
                                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--wizard-text-primary)' }}>Basic Information</h4>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Collection Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="e.g., Spring Summer 2026"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Collection Code</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    className={styles.input}
                                    disabled
                                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                                    title="Code cannot be changed after creation"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className={styles.textarea}
                                    rows={3}
                                    placeholder="Describe the collection's vision..."
                                />
                            </div>

                            {/* DA Analysis Fields */}
                            {daAnalysis && (
                                <>
                                    {/* Background Section */}
                                    <div className={styles.sectionDivider} style={{ marginTop: '24px' }}>
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

                                    {/* Atmosphere */}
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
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <motion.button
                        className={styles.backBtn}
                        onClick={onClose}
                        whileTap={{ scale: 0.97 }}
                    >
                        Cancel
                    </motion.button>

                    <div className={styles.footerRight}>
                        <motion.button
                            className={`${styles.createBtn} ${isSubmitting ? styles.loading : ''}`}
                            onClick={handleSave}
                            disabled={isSubmitting}
                            whileTap={{ scale: 0.97 }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className={styles.spinner} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    Save Changes
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default EditCollectionModal;
