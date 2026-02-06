'use client';

import React, { useCallback, useMemo } from 'react';
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
    Play,
    Loader2,
} from 'lucide-react';
import {
    ShotOptions,
    ShotOption,
    SoloShotOption,
    FlatlayOption,
    createDefaultShotOptions,
} from '@/libs/types/homepage/shot-options';

export interface ShotTypeConfig {
    id: keyof ShotOptions;
    label: string;
    icon: React.ReactNode;
    hasToggle: boolean;
    toggleType?: 'subject' | 'size';
    fixedLabel?: string; // For DUO: "Father + Son"
}

interface HomeBottomProps {
    isDarkMode?: boolean;
    shotOptions: ShotOptions;
    onShotOptionsChange: (options: ShotOptions) => void;
    resolution: '4k' | '2k';
    onResolutionChange: (res: '4k' | '2k') => void;
    aspectRatio: '4:5' | '1:1' | '9:16' | '16:9';
    onAspectRatioChange: (ratio: '4:5' | '1:1' | '9:16' | '16:9') => void;
    onGenerate: (shotOptions: ShotOptions) => void;
    isGenerating?: boolean;
    isAnalyzed?: boolean;
    hasDA?: boolean;
    // NEW: Props for Generate Images button
    hasMergedPrompts?: boolean;
    onGenerateImages?: () => void;
    isGeneratingImages?: boolean;
    generatingProgress?: number;
    // Props for Generate with New DA
    onRegenerateWithNewDA?: () => void;
    isRegenerationAvailable?: boolean;
    regenerationContext?: 'current' | 'library';
    // Props for hiding buttons after generation completes
    hasCompletedGeneration?: boolean;
    isMerging?: boolean;
    isNewDAFlow?: boolean;
}

const SHOT_TYPE_CONFIGS: ShotTypeConfig[] = [
    {
        id: 'duo',
        label: 'DUO',
        icon: <Users size={16} />,
        hasToggle: false,
        fixedLabel: 'Father + Son',
    },
    {
        id: 'solo',
        label: 'SOLO',
        icon: <User size={16} />,
        hasToggle: true,
        toggleType: 'subject',
    },
    {
        id: 'flatlay_front',
        label: 'FLAT F',
        icon: <Layout size={16} />,
        hasToggle: true,
        toggleType: 'size',
    },
    {
        id: 'flatlay_back',
        label: 'FLAT B',
        icon: <LayoutList size={16} />,
        hasToggle: true,
        toggleType: 'size',
    },
    {
        id: 'closeup_front',
        label: 'CLOSE F',
        icon: <ZoomIn size={16} />,
        hasToggle: false,
    },
    {
        id: 'closeup_back',
        label: 'CLOSE B',
        icon: <ZoomIn size={16} />,
        hasToggle: false,
    },
];

const HomeBottom: React.FC<HomeBottomProps> = ({
    isDarkMode = true,
    shotOptions,
    onShotOptionsChange,
    resolution,
    onResolutionChange,
    aspectRatio,
    onAspectRatioChange,
    onGenerate,
    isGenerating = false,
    isAnalyzed = false,
    hasDA = false,
    // NEW: Generate Images props
    hasMergedPrompts = false,
    onGenerateImages,
    isGeneratingImages = false,
    generatingProgress = 0,
    // Generate with New DA props
    onRegenerateWithNewDA,
    isRegenerationAvailable = false,
    regenerationContext = 'current',
    // Hide buttons after generation completes
    hasCompletedGeneration = false,
    isMerging = false,
    isNewDAFlow = false,
}) => {
    // Count enabled shots
    const enabledCount = useMemo(() => {
        return Object.values(shotOptions).filter((shot) => shot?.enabled).length;
    }, [shotOptions]);

    // Select all logic
    const handleSelectAll = useCallback(() => {
        const allEnabled = enabledCount === SHOT_TYPE_CONFIGS.length;
        const newOptions = { ...shotOptions };

        SHOT_TYPE_CONFIGS.forEach((config) => {
            const currentShot = shotOptions[config.id];
            if (config.id === 'solo') {
                (newOptions[config.id] as SoloShotOption) = {
                    enabled: !allEnabled,
                    subject: (currentShot as SoloShotOption)?.subject || 'adult',
                };
            } else if (config.id === 'flatlay_front' || config.id === 'flatlay_back') {
                (newOptions[config.id] as FlatlayOption) = {
                    enabled: !allEnabled,
                    size: (currentShot as FlatlayOption)?.size || 'adult',
                };
            } else {
                (newOptions[config.id] as ShotOption) = { enabled: !allEnabled };
            }
        });

        onShotOptionsChange(newOptions);
    }, [enabledCount, shotOptions, onShotOptionsChange]);

    // Toggle individual shot enabled/disabled
    const handleShotToggle = useCallback(
        (shotId: keyof ShotOptions) => {
            const currentShot = shotOptions[shotId];
            const isEnabled = currentShot?.enabled ?? false;
            const newOptions = { ...shotOptions };

            if (shotId === 'solo') {
                (newOptions[shotId] as SoloShotOption) = {
                    enabled: !isEnabled,
                    subject: (currentShot as SoloShotOption)?.subject || 'adult',
                };
            } else if (shotId === 'flatlay_front' || shotId === 'flatlay_back') {
                (newOptions[shotId] as FlatlayOption) = {
                    enabled: !isEnabled,
                    size: (currentShot as FlatlayOption)?.size || 'adult',
                };
            } else {
                (newOptions[shotId] as ShotOption) = { enabled: !isEnabled };
            }

            onShotOptionsChange(newOptions);
        },
        [shotOptions, onShotOptionsChange]
    );

    // Toggle per-shot adult/kid setting
    const handleShotModeToggle = useCallback(
        (shotId: keyof ShotOptions, newValue: 'adult' | 'kid') => {
            const newOptions = { ...shotOptions };
            const currentShot = shotOptions[shotId];

            if (shotId === 'solo') {
                (newOptions[shotId] as SoloShotOption) = {
                    enabled: currentShot?.enabled ?? true,
                    subject: newValue,
                };
            } else if (shotId === 'flatlay_front' || shotId === 'flatlay_back') {
                (newOptions[shotId] as FlatlayOption) = {
                    enabled: currentShot?.enabled ?? true,
                    size: newValue,
                };
            }

            onShotOptionsChange(newOptions);
        },
        [shotOptions, onShotOptionsChange]
    );

    // Get current mode for a shot
    const getShotMode = useCallback(
        (shotId: keyof ShotOptions): 'adult' | 'kid' => {
            const shot = shotOptions[shotId];
            if (shotId === 'solo') {
                return (shot as SoloShotOption)?.subject || 'adult';
            } else if (shotId === 'flatlay_front' || shotId === 'flatlay_back') {
                return (shot as FlatlayOption)?.size || 'adult';
            }
            return 'adult';
        },
        [shotOptions]
    );

    // Handle generate
    const handleGenerate = useCallback(() => {
        if (enabledCount === 0) return;
        onGenerate(shotOptions);
    }, [enabledCount, shotOptions, onGenerate]);

    const canGenerate = useMemo(() => {
        return isAnalyzed && hasDA && enabledCount > 0 && !isGenerating;
    }, [isAnalyzed, hasDA, enabledCount, isGenerating]);

    const generateButtonText = useMemo(() => {
        if (isGenerating) return 'Generating...';
        if (!isAnalyzed) return 'Upload Product First';
        if (!hasDA) return 'Select DA Preset';
        if (enabledCount === 0) return 'Select Shots';
        return `Merge Prompts`;
    }, [isGenerating, isAnalyzed, hasDA, enabledCount]);

    return (
        <div className={`${styles.container} ${isDarkMode ? styles.dark : styles.light}`}>
            {/* Left Section: Shot Types */}
            <div className={styles.leftSection}>
                {/* Select All Button */}
                <button
                    className={`${styles.selectAllBtn} ${enabledCount === SHOT_TYPE_CONFIGS.length ? styles.active : ''}`}
                    onClick={handleSelectAll}
                    title="Select All"
                >
                    <Check size={16} />
                    <span>All</span>
                </button>

                <div className={styles.divider} />

                {/* Shot Type Buttons with Per-Shot Toggles */}
                <div className={styles.shotTypes}>
                    {SHOT_TYPE_CONFIGS.map((config) => {
                        const isEnabled = shotOptions[config.id]?.enabled ?? false;
                        const currentMode = getShotMode(config.id);

                        return (
                            <div key={config.id} className={styles.shotGroup}>
                                {/* Main shot button */}
                                <button
                                    className={`${styles.shotBtn} ${isEnabled ? styles.active : ''}`}
                                    onClick={() => handleShotToggle(config.id)}
                                >
                                    {config.icon}
                                    <span>{config.label}</span>
                                    {/* DUO: Show fixed badge */}
                                    {config.fixedLabel && isEnabled && (
                                        <span className={styles.fixedBadge}>F+S</span>
                                    )}
                                    {/* Shots with toggle: Show current mode badge */}
                                    {config.hasToggle && isEnabled && (
                                        <span className={styles.ageBadge}>
                                            {currentMode === 'adult' ? 'A' : 'K'}
                                        </span>
                                    )}
                                </button>

                                {/* Per-shot Adult/Kid toggle (shown when enabled and has toggle) */}
                                {config.hasToggle && isEnabled && (
                                    <div className={styles.miniToggle}>
                                        <button
                                            className={`${styles.miniBtn} ${currentMode === 'adult' ? styles.active : ''}`}
                                            onClick={() => handleShotModeToggle(config.id, 'adult')}
                                            title={config.toggleType === 'subject' ? 'Adult Model' : 'Adult Size'}
                                        >
                                            <UserCheck size={12} />
                                        </button>
                                        <button
                                            className={`${styles.miniBtn} ${currentMode === 'kid' ? styles.active : ''}`}
                                            onClick={() => handleShotModeToggle(config.id, 'kid')}
                                            title={config.toggleType === 'subject' ? 'Kid Model' : 'Kid Size'}
                                        >
                                            <Baby size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Center Section: Options (Resolution, Ratio) */}
            <div className={styles.centerSection}>
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
                        <button
                            className={`${styles.optionBtn} ${aspectRatio === '16:9' ? styles.active : ''}`}
                            onClick={() => onAspectRatioChange('16:9')}
                        >
                            <span>16:9</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Section: Generate Button */}
            <div className={styles.rightSection}>
                {/* Generate Images with New DA - only when DA changed, hides on click */}
                {isRegenerationAvailable && !isMerging && onRegenerateWithNewDA && (
                    <button
                        className={`${styles.generateBtn} ${styles.ready}`}
                        onClick={onRegenerateWithNewDA}
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)',
                        }}
                    >
                        <Sparkles size={16} />
                        <span>Generate Images with New DA</span>
                    </button>
                )}

                {/* Generate Images Button (only before generation completes, not during new DA flow) */}
                {!isNewDAFlow && !hasCompletedGeneration && hasMergedPrompts && onGenerateImages && !isRegenerationAvailable && (
                    <button
                        className={`${styles.generateBtn} ${styles.ready}`}
                        onClick={onGenerateImages}
                        disabled={isGeneratingImages}
                        style={{ background: '#8b5cf6' }}
                    >
                        {isGeneratingImages ? (
                            <>
                                <Loader2 size={16} className={styles.spin} />
                                <span>Generating... {Math.round(generatingProgress)}%</span>
                            </>
                        ) : (
                            <>
                                <Play size={16} />
                                <span>Generate Images</span>
                            </>
                        )}
                    </button>
                )}

                {/* Merge Prompts Button (only before generation completes, not during new DA flow) */}
                {!isNewDAFlow && !hasCompletedGeneration && !hasMergedPrompts && !isRegenerationAvailable && (
                    <button
                        className={`${styles.generateBtn} ${canGenerate ? styles.ready : styles.disabled}`}
                        onClick={handleGenerate}
                        disabled={!canGenerate}
                    >
                        <Sparkles size={16} />
                        <span>{generateButtonText}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default HomeBottom;

// Export helper for creating default options
export { createDefaultShotOptions };