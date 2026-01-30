'use client';

import React, { useState, useCallback, useMemo } from 'react';
import styles from '@/scss/styles/HomePage/HomeBottom.module.scss';
import {
    Users,
    User,
    Layout,
    LayoutList,
    ZoomIn,
    Sparkles,
    Baby,
    UserCheck,
    Check,
} from 'lucide-react';

export interface ShotType {
    id: string;
    label: string;
    icon: React.ReactNode;
    hasAgeToggle?: boolean; // For SOLO and FLAT shots
    variants?: { id: string; label: string }[];
}

interface HomeBottomProps {
    isDarkMode?: boolean;
    selectedShots: string[];
    onShotsChange: (shots: string[]) => void;
    ageMode: 'adult' | 'kid';
    onAgeModeChange: (mode: 'adult' | 'kid') => void;
    resolution: '4k' | '2k';
    onResolutionChange: (res: '4k' | '2k') => void;
    aspectRatio: '4:5' | '1:1' | '9:16';
    onAspectRatioChange: (ratio: '4:5' | '1:1' | '9:16') => void;
    onGenerate: (visualTypes: string[]) => void;
    isGenerating?: boolean;
    isAnalyzed?: boolean; // Product analyzed?
    hasDA?: boolean; // DA preset selected?
}

const SHOT_TYPES: ShotType[] = [
    { id: 'duo', label: 'DUO', icon: <Users size={18} /> },
    {
        id: 'solo',
        label: 'SOLO',
        icon: <User size={18} />,
        hasAgeToggle: true,
    },
    {
        id: 'flatlay_front',
        label: 'FLAT F',
        icon: <Layout size={18} />,
        hasAgeToggle: true,
    },
    {
        id: 'flatlay_back',
        label: 'FLAT B',
        icon: <LayoutList size={18} />,
        hasAgeToggle: true,
    },
    { id: 'closeup_front', label: 'CLOSE F', icon: <ZoomIn size={18} /> },
    { id: 'closeup_back', label: 'CLOSE B', icon: <ZoomIn size={18} /> },
];

const HomeBottom: React.FC<HomeBottomProps> = ({
    isDarkMode = true,
    selectedShots,
    onShotsChange,
    ageMode,
    onAgeModeChange,
    resolution,
    onResolutionChange,
    aspectRatio,
    onAspectRatioChange,
    onGenerate,
    isGenerating = false,
    isAnalyzed = false,
    hasDA = false,
}) => {
    // Select all logic...
    const handleSelectAll = useCallback(() => {
        if (selectedShots.length === SHOT_TYPES.length) {
            onShotsChange([]);
        } else {
            onShotsChange(SHOT_TYPES.map(s => s.id));
        }
    }, [selectedShots, onShotsChange]);

    const handleShotToggle = useCallback((shotId: string) => {
        if (selectedShots.includes(shotId)) {
            onShotsChange(selectedShots.filter(id => id !== shotId));
        } else {
            onShotsChange([...selectedShots, shotId]);
        }
    }, [selectedShots, onShotsChange]);

    const handleGenerate = useCallback(() => {
        if (selectedShots.length === 0) {
            return;
        }

        // Add age suffix for shots that support it
        const visualTypes = selectedShots.map(shotId => {
            const shot = SHOT_TYPES.find(s => s.id === shotId);
            if (shot?.hasAgeToggle) {
                return `${shotId}_${ageMode}`;
            }
            return shotId;
        });

        // We assume resolution and aspect ratio are handled in global state or appended here if needed
        // For now, simple console log or just passing visual types as before
        onGenerate(visualTypes);
    }, [selectedShots, ageMode, onGenerate]);

    const canGenerate = useMemo(() => {
        return isAnalyzed && hasDA && selectedShots.length > 0 && !isGenerating;
    }, [isAnalyzed, hasDA, selectedShots, isGenerating]);

    const generateButtonText = useMemo(() => {
        if (isGenerating) return 'Generating...';
        if (!isAnalyzed) return 'Upload Product First';
        if (!hasDA) return 'Select DA Preset';
        if (selectedShots.length === 0) return 'Select Shots';
        return `Generate x${selectedShots.length}`;
    }, [isGenerating, isAnalyzed, hasDA, selectedShots.length]);

    // Check if any selected shot has age toggle
    const showAgeToggle = useMemo(() => {
        return selectedShots.some(shotId => {
            const shot = SHOT_TYPES.find(s => s.id === shotId);
            return shot?.hasAgeToggle;
        });
    }, [selectedShots]);

    return (
        <div className={`${styles.container} ${isDarkMode ? styles.dark : styles.light}`}>
            {/* Left Section: Shot Types */}
            <div className={styles.leftSection}>
                {/* Select All Button */}
                <button
                    className={`${styles.selectAllBtn} ${selectedShots.length === SHOT_TYPES.length ? styles.active : ''}`}
                    onClick={handleSelectAll}
                    title="Select All"
                >
                    <Check size={16} />
                    <span>All</span>
                </button>

                <div className={styles.divider} />

                {/* Shot Type Buttons */}
                <div className={styles.shotTypes}>
                    {SHOT_TYPES.map((shot) => (
                        <button
                            key={shot.id}
                            className={`${styles.shotBtn} ${selectedShots.includes(shot.id) ? styles.active : ''}`}
                            onClick={() => handleShotToggle(shot.id)}
                        >
                            {shot.icon}
                            <span>{shot.label}</span>
                            {shot.hasAgeToggle && selectedShots.includes(shot.id) && (
                                <span className={styles.ageBadge}>
                                    {ageMode === 'adult' ? 'A' : 'K'}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Center Section: Options (Model, Resolution, Ratio) */}
            <div className={styles.centerSection}>

                {/* Model / Age Toggle */}
                {showAgeToggle && (
                    <div className={styles.optionGroup}>
                        <span className={styles.optionLabel}>Model:</span>
                        <div className={styles.optionButtons}>
                            <button
                                className={`${styles.optionBtn} ${ageMode === 'adult' ? styles.active : ''}`}
                                onClick={() => onAgeModeChange('adult')}
                            >
                                <UserCheck size={16} />
                                <span>Adult</span>
                            </button>
                            <button
                                className={`${styles.optionBtn} ${ageMode === 'kid' ? styles.active : ''}`}
                                onClick={() => onAgeModeChange('kid')}
                            >
                                <Baby size={16} />
                                <span>Kid</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Divider if Model toggle is shown */}
                {showAgeToggle && <div className={styles.dividerSmall} />}

                {/* Resolution Toggle */}
                <div className={styles.optionGroup}>
                    <span className={styles.optionLabel}>Res:</span>
                    <div className={styles.optionButtons}>
                        <button
                            className={`${styles.optionBtn} ${resolution === '4k' ? styles.active : ''}`}
                            onClick={() => onResolutionChange('4k')}
                        >
                            <span>4K</span>
                        </button>
                        <button
                            className={`${styles.optionBtn} ${resolution === '2k' ? styles.active : ''}`}
                            onClick={() => onResolutionChange('2k')}
                        >
                            <span>2K</span>
                        </button>
                    </div>
                </div>

                <div className={styles.dividerSmall} />

                {/* Aspect Ratio Toggle */}
                <div className={styles.optionGroup}>
                    <span className={styles.optionLabel}>Ratio:</span>
                    <div className={styles.optionButtons}>
                        <button
                            className={`${styles.optionBtn} ${aspectRatio === '4:5' ? styles.active : ''}`}
                            onClick={() => onAspectRatioChange('4:5')}
                        >
                            <span>4:5</span>
                        </button>
                        <button
                            className={`${styles.optionBtn} ${aspectRatio === '1:1' ? styles.active : ''}`}
                            onClick={() => onAspectRatioChange('1:1')}
                        >
                            <span>1:1</span>
                        </button>
                        <button
                            className={`${styles.optionBtn} ${aspectRatio === '9:16' ? styles.active : ''}`}
                            onClick={() => onAspectRatioChange('9:16')}
                        >
                            <span>9:16</span>
                        </button>
                    </div>
                </div>

            </div>

            {/* Right Section: Generate Button */}
            <div className={styles.rightSection}>
                <button
                    className={`${styles.generateBtn} ${canGenerate ? styles.ready : styles.disabled}`}
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                >
                    <Sparkles size={18} />
                    <span>{generateButtonText}</span>
                </button>
            </div>
        </div>
    );
};

export default HomeBottom;