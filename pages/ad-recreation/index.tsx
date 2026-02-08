// pages/ad-recreation/index.tsx
// Controller Pattern: State management, UI delegation, Real-time polling
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from "@mui/material";
import { Loader2 } from 'lucide-react';
import HomeTop from '@/libs/components/homePage/HomeTop';
import { withAuth } from "@/libs/components/auth/withAuth";
import { logout, getUserInfo, UserInfo } from '@/libs/server/HomePage/signup';
import {
    generateAdVariations,
    getGenerationStatus,
    GenerationResult
} from '@/libs/server/Ad-Recreation/generation/generation.service';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

// Sidebar Components
import BrandSelect from '@/libs/components/ad-recreation/sidebar/BrandSelect';
import ModeToggle from '@/libs/components/ad-recreation/sidebar/ModeToggle';
import AdUploader from '@/libs/components/ad-recreation/sidebar/AdUploader';
import ProductForm from '@/libs/components/ad-recreation/sidebar/ProductForm';
import AngleSelector, { MARKETING_ANGLES } from '@/libs/components/ad-recreation/sidebar/AngleSelector';
import FormatSelector, { OUTPUT_FORMATS } from '@/libs/components/ad-recreation/sidebar/FormatSelector';

// Gallery Components
import EmptyState from '@/libs/components/ad-recreation/gallery/EmptyState';
import AnalysisStage from '@/libs/components/ad-recreation/gallery/AnalysisStage';
import ResultsGrid, { MockResult } from '@/libs/components/ad-recreation/gallery/ResultsGrid';

// ============================================
// PLACEHOLDER RESULT INTERFACE
// ============================================
interface PlaceholderResult extends MockResult {
    isLoading?: boolean;
}

// ============================================
// MAIN PAGE CONTROLLER
// ============================================
const AdRecreationPage: React.FC = () => {
    const router = useRouter();
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    // ============================================
    // STATE
    // ============================================
    const [user, setUser] = useState<UserInfo | null>(null);
    const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
    const [activeMode, setActiveMode] = useState<'single' | 'batch'>('single');

    // Inspiration/Concept state
    const [conceptId, setConceptId] = useState<string | null>(null);
    const [analysisJson, setAnalysisJson] = useState<any>(null);
    const [inspirationImageUrl, setInspirationImageUrl] = useState<string | null>(null);

    const [productDetails, setProductDetails] = useState('');
    const [selectedAngles, setSelectedAngles] = useState<string[]>([]);
    const [selectedFormats, setSelectedFormats] = useState<string[]>(['story']);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Generation results (with placeholders)
    const [generatedResults, setGeneratedResults] = useState<PlaceholderResult[]>([]);
    const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
    const [completedCount, setCompletedCount] = useState(0);
    const [totalExpected, setTotalExpected] = useState(0);

    // Polling ref
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Load user info on mount
    useEffect(() => {
        const userInfo = getUserInfo();
        setUser(userInfo);

        // Cleanup polling on unmount
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    // ============================================
    // HANDLERS
    // ============================================

    const handleUploadSuccess = (data: { conceptId: string; analysisJson: any; imageUrl: string }) => {
        setConceptId(data.conceptId);
        setAnalysisJson(data.analysisJson);
        setInspirationImageUrl(data.imageUrl);
        console.log('Concept analyzed:', data.conceptId);
    };

    const handleAngleToggle = (angleId: string) => {
        setSelectedAngles(prev =>
            prev.includes(angleId)
                ? prev.filter(a => a !== angleId)
                : [...prev, angleId]
        );
    };

    const handleFormatToggle = (formatId: string) => {
        setSelectedFormats(prev =>
            prev.includes(formatId)
                ? prev.filter(f => f !== formatId)
                : [...prev, formatId]
        );
    };

    // Calculate expected images: angles × formats × 4 variations
    const calculateExpectedImages = () => {
        // For P0 MVP: 1 image per format per angle (not 4 variations yet)
        return selectedAngles.length * selectedFormats.length;
    };

    // Create placeholder cards
    const createPlaceholders = (): PlaceholderResult[] => {
        const placeholders: PlaceholderResult[] = [];
        let index = 0;

        for (const angleId of selectedAngles) {
            for (const formatId of selectedFormats) {
                const angle = MARKETING_ANGLES.find(a => a.id === angleId);
                placeholders.push({
                    id: `placeholder-${index}`,
                    angle: angleId,
                    format: formatId,
                    imageUrl: '',
                    headline: angle?.label || 'Generating...',
                    cta: 'Loading...',
                    subtext: 'Creating your ad...',
                    isLoading: true,
                });
                index++;
            }
        }

        return placeholders;
    };

    // Map aspect ratio to format ID
    const aspectRatioToFormat = (ratio: string): string => {
        switch (ratio) {
            case '9:16': return 'story';
            case '1:1': return 'square';
            case '4:5': return 'portrait';
            case '16:9': return 'landscape';
            default: return selectedFormats[0];
        }
    };

    // Start generation
    const handleGenerate = async () => {
        console.log('🚀 ========== GENERATE AD CLICKED ==========');

        setErrorMessage(null);

        // Validation
        if (!selectedBrandId) {
            setErrorMessage('Please select a brand');
            return;
        }
        if (!conceptId) {
            setErrorMessage('Please upload an inspiration ad first');
            return;
        }
        if (!productDetails.trim()) {
            setErrorMessage('Please enter product details');
            return;
        }
        if (selectedAngles.length === 0) {
            setErrorMessage('Please select at least one marketing angle');
            return;
        }
        if (selectedFormats.length === 0) {
            setErrorMessage('Please select at least one format');
            return;
        }

        // Calculate expected images
        const expected = calculateExpectedImages();
        setTotalExpected(expected);
        setCompletedCount(0);
        setGenerationProgress(0);

        // Create placeholders immediately
        const placeholders = createPlaceholders();
        setGeneratedResults(placeholders);
        setShowResults(true);
        setIsGenerating(true);

        console.log(`📊 Expected images: ${expected}`);
        console.log(`📊 Placeholders created: ${placeholders.length}`);

        try {
            // For P0: Generate one at a time for each angle/format combo
            // In future: batch API call
            let completedResults: PlaceholderResult[] = [];
            let completed = 0;

            for (const angleId of selectedAngles) {
                for (const formatId of selectedFormats) {
                    const payload = {
                        brand_id: selectedBrandId,
                        concept_id: conceptId,
                        product_input: productDetails,
                        marketing_angle_id: angleId,
                        format_id: formatId,
                    };

                    console.log(`📤 Generating: angle=${angleId}, format=${formatId}`);

                    try {
                        const result = await generateAdVariations(payload);
                        const resultImages = (result as any).result_images || [];
                        const generatedCopy = (result as any).generated_copy || {};

                        // Process result
                        if (resultImages.length > 0) {
                            const img = resultImages[0];
                            let imageUrl = 'https://placehold.co/1080x1920/1a1a2e/FFF?text=Generated+Ad';

                            if (img.base64 && img.base64.length > 0) {
                                const mimeType = img.mimeType || 'image/png';
                                imageUrl = `data:${mimeType};base64,${img.base64}`;
                            } else if (img.url) {
                                imageUrl = img.url;
                            }

                            completedResults.push({
                                id: img.id || `gen-${completed}`,
                                angle: angleId,
                                format: formatId,
                                imageUrl: imageUrl,
                                headline: generatedCopy.headline || 'Your Ad',
                                cta: generatedCopy.cta || 'Shop Now',
                                subtext: generatedCopy.subheadline || '',
                                isLoading: false,
                            });
                        } else if (generatedCopy.headline) {
                            // No image but has copy
                            completedResults.push({
                                id: `gen-${completed}`,
                                angle: angleId,
                                format: formatId,
                                imageUrl: 'https://placehold.co/1080x1920/1a1a2e/FFF?text=Copy+Only',
                                headline: generatedCopy.headline,
                                cta: generatedCopy.cta || 'Shop Now',
                                subtext: generatedCopy.subheadline || '',
                                isLoading: false,
                            });
                        }

                        completed++;
                        setCompletedCount(completed);
                        setGenerationProgress((completed / expected) * 100);

                        // Update results progressively
                        const updatedResults = [...placeholders];
                        completedResults.forEach((cr, idx) => {
                            if (idx < updatedResults.length) {
                                updatedResults[idx] = cr;
                            }
                        });
                        setGeneratedResults(updatedResults);

                    } catch (err) {
                        console.error(`❌ Failed for angle=${angleId}, format=${formatId}:`, err);
                        completed++;
                        setCompletedCount(completed);
                    }
                }
            }

            // Final update
            if (completedResults.length > 0) {
                setGeneratedResults(completedResults);
            }
            setGenerationProgress(100);

        } catch (error: any) {
            console.error('❌ Generation failed:', error);
            setErrorMessage(error.message || 'Generation failed. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/signup');
    };

    const canGenerate = conceptId && selectedAngles.length > 0 && selectedFormats.length > 0;
    const lightClass = !isDarkMode ? styles.light : '';

    // ============================================
    // RENDER
    // ============================================
    return (
        <>
            <div className={`${styles.pageWrapper} ${lightClass}`} style={{ paddingBottom: 100 }}>
                {/* LEFT SIDEBAR */}
                <div className={`${styles.sidebar} ${lightClass}`} style={{ height: 'calc(100vh - 100px)' }}>
                    <div className={styles.sidebarContent}>
                        <BrandSelect
                            selectedBrandId={selectedBrandId}
                            onSelect={setSelectedBrandId}
                            isDarkMode={isDarkMode}
                        />

                        <ModeToggle
                            activeMode={activeMode}
                            onChange={setActiveMode}
                            isDarkMode={isDarkMode}
                        />

                        <AdUploader
                            onUploadSuccess={handleUploadSuccess}
                            isDarkMode={isDarkMode}
                        />

                        <ProductForm
                            value={productDetails}
                            onChange={setProductDetails}
                            isDarkMode={isDarkMode}
                        />

                        {/* New Dropdown AngleSelector */}
                        <AngleSelector
                            selected={selectedAngles}
                            onChange={handleAngleToggle}
                            isDarkMode={isDarkMode}
                        />
                    </div>
                </div>

                {/* MAIN AREA */}
                <div className={styles.mainArea}>
                    <HomeTop />

                    <div className={`${styles.contentArea} ${lightClass}`} style={{ paddingBottom: 120 }}>
                        {/* Progress Bar */}
                        {isGenerating && totalExpected > 0 && (
                            <div
                                style={{
                                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                    borderRadius: '12px',
                                    padding: '16px 20px',
                                    marginBottom: '20px',
                                    border: '1px solid rgba(124, 77, 255, 0.2)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                    <Loader2 size={18} className="animate-spin" style={{ color: '#7c4dff' }} />
                                    <span style={{ fontSize: '14px', fontWeight: 500 }}>
                                        Generating {completedCount} of {totalExpected} ads...
                                    </span>
                                </div>
                                <div
                                    style={{
                                        height: '6px',
                                        background: 'rgba(124, 77, 255, 0.2)',
                                        borderRadius: '3px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${generationProgress}%`,
                                            background: 'linear-gradient(90deg, #7c4dff 0%, #448aff 100%)',
                                            transition: 'width 0.3s ease',
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error Display */}
                        {errorMessage && (
                            <div style={{
                                background: 'rgba(255, 59, 48, 0.1)',
                                border: '1px solid rgba(255, 59, 48, 0.3)',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                marginBottom: '16px',
                                color: '#FF3B30',
                                fontSize: '14px',
                            }}>
                                ❌ {errorMessage}
                            </div>
                        )}

                        {/* Content */}
                        {showResults ? (
                            <ResultsGrid
                                results={generatedResults.filter(r => !r.isLoading)}
                                angles={MARKETING_ANGLES}
                                selectedAngles={selectedAngles}
                                selectedFormats={selectedFormats}
                                isDarkMode={isDarkMode}
                            />
                        ) : analysisJson ? (
                            <AnalysisStage
                                data={analysisJson}
                                conceptId={conceptId || undefined}
                                onUpdate={setAnalysisJson}
                                isDarkMode={isDarkMode}
                            />
                        ) : (
                            <EmptyState isDarkMode={isDarkMode} />
                        )}
                    </div>
                </div>
            </div>

            {/* BOTTOM BAR - Formats + Generate Button */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '80px',
                    background: isDarkMode
                        ? 'linear-gradient(180deg, rgba(26,26,46,0.95) 0%, rgba(26,26,46,1) 100%)'
                        : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 100%)',
                    borderTop: '1px solid rgba(124, 77, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    zIndex: 100,
                    backdropFilter: 'blur(10px)',
                }}
            >
                {/* Left: Format Selector */}
                <FormatSelector
                    selected={selectedFormats}
                    onChange={handleFormatToggle}
                    isDarkMode={isDarkMode}
                    compact
                />

                {/* Center: Status */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                    {isGenerating ? (
                        <span style={{ color: '#7c4dff', fontSize: '14px' }}>
                            Generating {completedCount}/{totalExpected}...
                        </span>
                    ) : showResults ? (
                        <span style={{ color: '#4caf50', fontSize: '14px' }}>
                            Generation Complete
                        </span>
                    ) : (
                        <span style={{ opacity: 0.6, fontSize: '14px' }}>
                            {canGenerate ? 'Ready to generate' : 'Complete setup to generate'}
                        </span>
                    )}
                </div>

                {/* Right: Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={!canGenerate || isGenerating}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: canGenerate && !isGenerating
                            ? 'linear-gradient(135deg, #7c4dff 0%, #448aff 100%)'
                            : 'rgba(124, 77, 255, 0.3)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: canGenerate && !isGenerating ? 'pointer' : 'not-allowed',
                        opacity: canGenerate && !isGenerating ? 1 : 0.6,
                        transition: 'all 0.2s ease',
                    }}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            ✨ Generate Ad
                        </>
                    )}
                </button>
            </div>
        </>
    );
};

export default withAuth(AdRecreationPage);
