// pages/ad-recreation/index.tsx
// Controller Pattern: State management, UI delegation, Real-time polling
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from "@mui/material";
import { Loader2, Eye, Download, X } from 'lucide-react';
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

    // Lightbox state for full-size image preview
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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

    // Download image handler
    const handleDownloadImage = async (imageUrl: string, fileName: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            console.log(`✅ Downloaded: ${fileName}`);
        } catch (error) {
            console.error('❌ Download failed:', error);
            alert('Download failed. Please try again.');
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

                        {/* Angle Selector */}
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
                                    <Loader2 size={18} className="spinner-icon" style={{ color: '#7c4dff' }} />
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
                        {(showResults || isGenerating) ? (
                            <div>
                                {/* Header */}
                                <div style={{ marginBottom: '20px' }}>
                                    <h2 style={{
                                        fontSize: '20px',
                                        fontWeight: 600,
                                        marginBottom: '4px',
                                        color: isDarkMode ? '#fff' : '#1a1a2e'
                                    }}>
                                        Generated Ads
                                    </h2>
                                    <p style={{
                                        fontSize: '13px',
                                        opacity: 0.6,
                                        color: isDarkMode ? '#fff' : '#1a1a2e'
                                    }}>
                                        {generatedResults.filter(r => !r.isLoading).length} of {generatedResults.length} completed
                                    </p>
                                </div>

                                {/* Horizontal Flex-Wrap Grid with All Cards - Sorted by Format */}
                                <style>{`
                                    @keyframes spin {
                                        from { transform: rotate(0deg); }
                                        to { transform: rotate(360deg); }
                                    }
                                    .spinner-icon {
                                        animation: spin 1s linear infinite;
                                    }
                                    .card-image-wrapper:hover .card-hover-overlay {
                                        opacity: 1 !important;
                                    }
                                `}</style>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '16px',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    {/* Sort by format: story first, then square, portrait, landscape */}
                                    {[...generatedResults]
                                        .sort((a, b) => {
                                            const formatOrder: Record<string, number> = {
                                                'story': 0,
                                                'square': 1,
                                                'portrait': 2,
                                                'landscape': 3,
                                            };
                                            return (formatOrder[a.format] ?? 99) - (formatOrder[b.format] ?? 99);
                                        })
                                        .map(result => {
                                            const getCardWidth = (format: string) => {
                                                switch (format) {
                                                    case 'story': return '200px';
                                                    case 'square': return '250px';
                                                    case 'portrait': return '220px';
                                                    case 'landscape': return '320px';
                                                    default: return '250px';
                                                }
                                            };
                                            const getAspectRatio = (format: string) => {
                                                switch (format) {
                                                    case 'story': return '9/16';
                                                    case 'square': return '1/1';
                                                    case 'portrait': return '4/5';
                                                    case 'landscape': return '16/9';
                                                    default: return '1/1';
                                                }
                                            };
                                            const getAngleLabel = (angleId: string) => {
                                                const angle = MARKETING_ANGLES.find(a => a.id === angleId);
                                                return angle ? `${angle.icon} ${angle.label}` : angleId;
                                            };

                                            return (
                                                <div
                                                    key={result.id}
                                                    style={{
                                                        width: getCardWidth(result.format),
                                                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
                                                        borderRadius: '12px',
                                                        overflow: 'hidden',
                                                        border: '1px solid rgba(124, 77, 255, 0.2)',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {/* Image Container */}
                                                    <div
                                                        style={{
                                                            position: 'relative',
                                                            aspectRatio: getAspectRatio(result.format),
                                                            overflow: 'hidden',
                                                            background: result.isLoading
                                                                ? 'linear-gradient(135deg, rgba(124, 77, 255, 0.2) 0%, rgba(68, 138, 255, 0.2) 100%)'
                                                                : '#1a1a2e',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        {result.isLoading ? (
                                                            <div style={{ textAlign: 'center' }}>
                                                                <Loader2
                                                                    size={32}
                                                                    className="spinner-icon"
                                                                    style={{ color: '#7c4dff', marginBottom: '8px' }}
                                                                />
                                                                <div style={{
                                                                    fontSize: '12px',
                                                                    color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
                                                                }}>
                                                                    Generating...
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="card-image-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                                <img
                                                                    src={result.imageUrl}
                                                                    alt={result.headline}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit: 'cover',
                                                                    }}
                                                                />
                                                                {/* Bottom text overlay with hover icons */}
                                                                <div
                                                                    style={{
                                                                        position: 'absolute',
                                                                        bottom: 0,
                                                                        left: 0,
                                                                        right: 0,
                                                                        padding: '12px',
                                                                        background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                                                                    }}
                                                                >
                                                                    {/* Text content */}
                                                                    <div style={{
                                                                        fontSize: '14px',
                                                                        fontWeight: 600,
                                                                        color: '#fff',
                                                                        marginBottom: '4px'
                                                                    }}>
                                                                        {result.headline}
                                                                    </div>
                                                                    <div style={{
                                                                        fontSize: '11px',
                                                                        color: 'rgba(255,255,255,0.7)',
                                                                        marginBottom: '6px'
                                                                    }}>
                                                                        {result.subtext}
                                                                    </div>

                                                                    {/* CTA and Hover Icons Row */}
                                                                    <div style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'space-between',
                                                                    }}>
                                                                        <div style={{
                                                                            display: 'inline-block',
                                                                            padding: '4px 10px',
                                                                            background: '#7c4dff',
                                                                            borderRadius: '4px',
                                                                            fontSize: '10px',
                                                                            fontWeight: 600,
                                                                            color: '#fff',
                                                                        }}>
                                                                            {result.cta}
                                                                        </div>

                                                                        {/* Hover Icons - appear on hover */}
                                                                        <div
                                                                            className="card-hover-overlay"
                                                                            style={{
                                                                                display: 'flex',
                                                                                gap: '8px',
                                                                                opacity: 0,
                                                                                transition: 'opacity 0.2s ease',
                                                                            }}
                                                                        >
                                                                            {/* Eye Button - Preview */}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setLightboxImage(result.imageUrl)}
                                                                                style={{
                                                                                    width: '32px',
                                                                                    height: '32px',
                                                                                    borderRadius: '50%',
                                                                                    background: 'rgba(255, 255, 255, 0.2)',
                                                                                    border: '1.5px solid rgba(255, 255, 255, 0.5)',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    cursor: 'pointer',
                                                                                    transition: 'all 0.2s ease',
                                                                                }}
                                                                                onMouseEnter={(e) => {
                                                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
                                                                                    e.currentTarget.style.transform = 'scale(1.1)';
                                                                                }}
                                                                                onMouseLeave={(e) => {
                                                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                                                                    e.currentTarget.style.transform = 'scale(1)';
                                                                                }}
                                                                            >
                                                                                <Eye size={16} color="#fff" />
                                                                            </button>

                                                                            {/* Download Button */}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDownloadImage(
                                                                                    result.imageUrl,
                                                                                    `${result.headline.replace(/[^a-zA-Z0-9]/g, '_')}_${result.id}.png`
                                                                                )}
                                                                                style={{
                                                                                    width: '32px',
                                                                                    height: '32px',
                                                                                    borderRadius: '50%',
                                                                                    background: 'rgba(255, 255, 255, 0.2)',
                                                                                    border: '1.5px solid rgba(255, 255, 255, 0.5)',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    cursor: 'pointer',
                                                                                    transition: 'all 0.2s ease',
                                                                                }}
                                                                                onMouseEnter={(e) => {
                                                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
                                                                                    e.currentTarget.style.transform = 'scale(1.1)';
                                                                                }}
                                                                                onMouseLeave={(e) => {
                                                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                                                                    e.currentTarget.style.transform = 'scale(1)';
                                                                                }}
                                                                            >
                                                                                <Download size={16} color="#fff" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Angle Badge + Format */}
                                                    <div
                                                        style={{
                                                            padding: '10px 12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            borderTop: '1px solid rgba(124, 77, 255, 0.1)',
                                                        }}
                                                    >
                                                        <span style={{
                                                            fontSize: '11px',
                                                            opacity: 0.7,
                                                            color: isDarkMode ? '#fff' : '#1a1a2e'
                                                        }}>
                                                            {getAngleLabel(result.angle)}
                                                        </span>
                                                        <span style={{
                                                            fontSize: '10px',
                                                            padding: '2px 6px',
                                                            background: 'rgba(124, 77, 255, 0.15)',
                                                            borderRadius: '4px',
                                                            color: '#7c4dff',
                                                        }}>
                                                            {result.format.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
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
            </div >

            {/* BOTTOM BAR - User Info + Formats + Generate Button */}
            < div
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
                }
                }
            >
                {/* Left: User Info */}
                < div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
                    {/* Avatar */}
                    < div
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7c4dff 0%, #448aff 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#fff',
                        }}
                    >
                        {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div >
                    {/* Name & Plan */}
                    < div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>
                            {user?.name || user?.email?.split('@')[0] || 'User'}
                        </span>
                        <span style={{ fontSize: '11px', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            👑 Pro Plan
                        </span>
                    </div >
                    {/* Logout */}
                    < button
                        onClick={handleLogout}
                        style={{
                            marginLeft: '8px',
                            padding: '6px 12px',
                            background: 'rgba(255, 59, 48, 0.1)',
                            border: '1px solid rgba(255, 59, 48, 0.3)',
                            borderRadius: '6px',
                            color: '#ff3b30',
                            fontSize: '12px',
                            cursor: 'pointer',
                        }}
                    >
                        Logout
                    </button >
                </div >

                {/* Center-Right: Format Selector (shifted right with marginLeft) */}
                < div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '40px' }}>
                    <FormatSelector
                        selected={selectedFormats}
                        onChange={handleFormatToggle}
                        isDarkMode={isDarkMode}
                        compact
                    />
                </div >

                {/* Center: Status */}
                < div style={{ flex: 1, textAlign: 'center' }}>
                    {
                        isGenerating ? (
                            <span style={{ color: '#7c4dff', fontSize: '14px' }} >
                                Generating {completedCount}/{totalExpected}...
                            </span >
                        ) : showResults ? (
                            <span style={{ color: '#4caf50', fontSize: '14px' }}>
                                Generation Complete
                            </span>
                        ) : (
                            <span style={{ opacity: 0.6, fontSize: '14px' }}>
                                {canGenerate ? 'Ready to generate' : 'Complete setup to generate'}
                            </span>
                        )}
                </div >

                {/* Right: Generate Button */}
                < button
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
                    {
                        isGenerating ? (
                            <>
                                <Loader2 size={16} className="spinner-icon" />
                                Generating...
                            </>
                        ) : (
                            <>
                                ✨ Generate Ad
                            </>
                        )}
                </button >
            </div >

            {/* Lightbox Modal for Full-Size Image Preview */}
            {
                lightboxImage && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.9)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '40px',
                        }}
                        onClick={() => setLightboxImage(null)}
                    >
                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={() => setLightboxImage(null)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.15)',
                                border: '2px solid rgba(255, 255, 255, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                            }}
                        >
                            <X size={24} color="#fff" />
                        </button>

                        {/* Download Button in Lightbox */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadImage(lightboxImage, `ad_image_${Date.now()}.png`);
                            }}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '80px',
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.15)',
                                border: '2px solid rgba(255, 255, 255, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                            }}
                        >
                            <Download size={22} color="#fff" />
                        </button>

                        {/* Lightbox Image */}
                        <img
                            src={lightboxImage}
                            alt="Full size preview"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                maxWidth: '90%',
                                maxHeight: '90%',
                                objectFit: 'contain',
                                borderRadius: '12px',
                                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                            }}
                        />
                    </div>
                )
            }
        </>
    );
};

export default withAuth(AdRecreationPage);
