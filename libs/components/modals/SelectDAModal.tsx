'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, Loader2 } from 'lucide-react';
import { getAllCollections } from '@/libs/server/HomePage/collection';
import { Collection } from '@/libs/types/homepage/collection';
import styles from '@/scss/styles/Modals/SelectDAModal.module.scss';

interface SelectDAModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (collectionId: string) => void;
    currentCollectionId?: string;
}

const SelectDAModal: React.FC<SelectDAModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    currentCollectionId,
}) => {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedId(null);
            setIsGenerating(false);
            setIsLoading(true);
            getAllCollections()
                .then(setCollections)
                .catch(console.error)
                .finally(() => setIsLoading(false));
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (!selectedId) return;
        setIsGenerating(true);
        onSelect(selectedId);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className={styles.modal}
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={styles.header}>
                            <h2 className={styles.title}>Select Design Aesthetic</h2>
                            <button className={styles.closeBtn} onClick={onClose}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className={styles.body}>
                            {isLoading ? (
                                <div className={styles.centerState}>
                                    <Loader2 size={28} className={styles.spinner} />
                                    <p>Loading DAs...</p>
                                </div>
                            ) : collections.length === 0 ? (
                                <div className={styles.centerState}>
                                    <p>No Design Aesthetics found</p>
                                </div>
                            ) : (
                                <div className={styles.grid}>
                                    {collections.map((col) => (
                                        <button
                                            key={col.id}
                                            className={`${styles.card} ${selectedId === col.id ? styles.selected : ''} ${col.id === currentCollectionId ? styles.current : ''}`}
                                            onClick={() => setSelectedId(col.id)}
                                        >
                                            <div className={styles.imageWrap}>
                                                {col.da_reference_image_url ? (
                                                    <img
                                                        src={col.da_reference_image_url}
                                                        alt={col.name}
                                                        className={styles.daImage}
                                                    />
                                                ) : (
                                                    <div className={styles.imagePlaceholder}>
                                                        <Sparkles size={22} />
                                                    </div>
                                                )}
                                                {selectedId === col.id && (
                                                    <div className={styles.checkOverlay}>
                                                        <Check size={20} />
                                                    </div>
                                                )}
                                                {col.id === currentCollectionId && (
                                                    <span className={styles.currentBadge}>Current</span>
                                                )}
                                            </div>
                                            <div className={styles.cardInfo}>
                                                <span className={styles.cardName}>{col.name}</span>
                                                {col.code && (
                                                    <span className={styles.cardCode}>{col.code}</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className={styles.footer}>
                            <button className={styles.cancelBtn} onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                className={`${styles.generateBtn} ${selectedId && !isGenerating ? styles.active : ''}`}
                                onClick={handleConfirm}
                                disabled={!selectedId || isGenerating}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={15} className={styles.spinner} />
                                        <span>Starting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={15} />
                                        <span>Generate</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SelectDAModal;
