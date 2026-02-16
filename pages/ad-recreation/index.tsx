// pages/ad-recreation/index.tsx
// Controller Pattern: State management, UI delegation, Real-time polling
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from "@mui/material";
import { Loader2, Eye, Download, X, Heart, RefreshCw, Trash2, Archive } from 'lucide-react';
import HomeTop from '@/libs/components/homePage/HomeTop';
import { withAuth } from "@/libs/components/auth/withAuth";
import { logout, getUserInfo, UserInfo } from '@/libs/server/HomePage/signup';
import {
    generateAdVariations,
    getGenerationStatus,
    regenerateVariation,
    GenerationResult
} from '@/libs/server/Ad-Recreation/generation/generation.service';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

// Sidebar Components
import BrandSelect from '@/libs/components/ad-recreation/sidebar/BrandSelect';
import ModeToggle from '@/libs/components/ad-recreation/sidebar/ModeToggle';
import AdUploader from '@/libs/components/ad-recreation/sidebar/AdUploader';
import AngleSelector, { MARKETING_ANGLES } from '@/libs/components/ad-recreation/sidebar/AngleSelector';
import FormatSelector, { OUTPUT_FORMATS } from '@/libs/components/ad-recreation/sidebar/FormatSelector';
import ProductUploadSection from '@/libs/components/homePage/ProductUploadSection';
import ProductDropdown from '@/libs/components/homePage/ProductDropdown';
import HeroImageSelector, { detectHeroZone, collectProductImages } from '@/libs/components/ad-recreation/sidebar/HeroImageSelector';
import { useProductContext } from '@/libs/context/ProductContext';
import { getAllProducts } from '@/libs/server/HomePage/product';
import { Product } from '@/libs/types/homepage/product';

// Gallery Components
import EmptyState from '@/libs/components/ad-recreation/gallery/EmptyState';
import AnalysisStage from '@/libs/components/ad-recreation/gallery/AnalysisStage';
import ResultsGrid, { MockResult } from '@/libs/components/ad-recreation/gallery/ResultsGrid';

// ============================================
// PLACEHOLDER RESULT INTERFACE
// ============================================
interface PlaceholderResult extends MockResult {
    isLoading?: boolean;
    generationId?: string;
    variationIndex?: number;
}

// ============================================
// MAIN PAGE CONTROLLER
// ============================================
const AdRecreationPage: React.FC = () => {
    const router = useRouter();
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    // Shared product context (persists across Product Visuals ↔ Ad Recreation)
    const {
        frontImage, backImage, referenceImages,
        setFrontImage, setBackImage, setReferenceImages,
        isAnalyzing, isAnalyzed,
        productJSON, productId,
        fullAnalysisResponse,
        handleAnalyze,
        handleProductSelect,
    } = useProductContext();

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

    // Hero Image Selection state
    const [selectedHeroImage, setSelectedHeroImage] = useState<string | null>(null);
    const [heroZoneId, setHeroZoneId] = useState<string | null>(null);
    const [heroZoneLabel, setHeroZoneLabel] = useState<string | null>(null);

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

    // P0: Favorite IDs (client-side state)
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    // P0: Generation ID map for regeneration
    const [generationIdMap, setGenerationIdMap] = useState<Record<string, string>>({});
    // P0: Regenerating variation IDs
    const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());

    // Polling ref
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Lightbox state for full-size image preview
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Product catalog state
    const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [activeProductId, setActiveProductId] = useState<string | null>(null);

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

    // Fetch analyzed products for the dropdown
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setCatalogLoading(true);
                const res = await getAllProducts(undefined, 1, 100);
                setCatalogProducts((res.items || []).filter((p: Product) => p.analyzed_product_json));
            } catch {
                setCatalogProducts([]);
            } finally {
                setCatalogLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Refetch catalog (called after sidebar upload+analyze to include new product)
    const refreshCatalog = async () => {
        try {
            const res = await getAllProducts(undefined, 1, 100);
            setCatalogProducts((res.items || []).filter((p: Product) => p.analyzed_product_json));
        } catch {
            // silent
        }
    };

    // Auto-sync: when product is analyzed via sidebar, set it as active and refresh dropdown
    useEffect(() => {
        if (productId && !activeProductId) {
            // Wait for catalog to refresh FIRST, then set productId as active
            const syncProduct = async () => {
                console.log(`📦 Auto-syncing product from sidebar: ${productId}`);
                // Small delay to let backend finalize the product record
                await new Promise(r => setTimeout(r, 500));
                await refreshCatalog();
                setActiveProductId(productId);
                console.log(`✅ Product auto-selected in dropdown: ${productId}`);
            };
            syncProduct();
        }
    }, [productId, activeProductId]);

    // Auto-detect hero zone when concept analysis changes
    useEffect(() => {
        if (analysisJson) {
            const zone = detectHeroZone(analysisJson);
            if (zone) {
                setHeroZoneId(zone.id);
                setHeroZoneLabel(zone.label);
                console.log(`🎯 Hero zone detected: "${zone.id}" (${zone.label})`);
            } else {
                setHeroZoneId(null);
                setHeroZoneLabel(null);
            }
            // Reset hero image selection when concept changes
            setSelectedHeroImage(null);
        } else {
            setHeroZoneId(null);
            setHeroZoneLabel(null);
            setSelectedHeroImage(null);
        }
    }, [analysisJson]);

    // Collect product images for hero selector
    const heroProductImages = React.useMemo(() => {
        // Note: referenceImages from context is File[] (upload state), not URLs.
        // Image URLs come from fullAnalysisResponse which is already handled inside collectProductImages.
        return collectProductImages(
            fullAnalysisResponse?.front_image_url || (typeof frontImage === 'string' ? frontImage : null),
            fullAnalysisResponse?.back_image_url || (typeof backImage === 'string' ? backImage : null),
            fullAnalysisResponse?.reference_images || null,
            fullAnalysisResponse,
        );
    }, [fullAnalysisResponse, frontImage, backImage]);

    // ============================================
    // HANDLERS
    // ============================================

    const handleUploadSuccess = (data: { conceptId: string; analysisJson: any; imageUrl: string }) => {
        setConceptId(data.conceptId);
        setAnalysisJson(data.analysisJson);
        setInspirationImageUrl(data.imageUrl);
        setSelectedHeroImage(null); // Reset hero selection on new concept
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
        // P0: 4 variations per angle/format combo
        return selectedAngles.length * selectedFormats.length * 4;
    };

    // Create placeholder cards (4 per angle/format combo)
    const createPlaceholders = (): PlaceholderResult[] => {
        const placeholders: PlaceholderResult[] = [];
        let index = 0;

        for (const angleId of selectedAngles) {
            for (const formatId of selectedFormats) {
                const angle = MARKETING_ANGLES.find(a => a.id === angleId);
                for (let v = 0; v < 4; v++) {
                    placeholders.push({
                        id: `placeholder-${index}`,
                        angle: angleId,
                        format: formatId,
                        imageUrl: '',
                        headline: angle?.label || 'Generating...',
                        cta: 'Loading...',
                        subtext: `Variation ${v + 1}`,
                        isLoading: true,
                        variationIndex: v + 1,
                    });
                    index++;
                }
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
        // Strict product validation
        const effectiveProductId = activeProductId || productId;
        if (!effectiveProductId) {
            setErrorMessage('Please select or upload a product first');
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
            let imagesDone = 0;
            const newGenIdMap: Record<string, string> = {};

            // Track placeholder index: which placeholder slot to fill next
            let placeholderIdx = 0;

            for (const angleId of selectedAngles) {
                for (const formatId of selectedFormats) {
                    const payload = {
                        brand_id: selectedBrandId,
                        concept_id: conceptId,
                        marketing_angle_id: angleId,
                        format_id: formatId,
                        product_id: effectiveProductId,
                        ...(selectedHeroImage && heroZoneId ? {
                            mapped_assets: {
                                hero_zone_id: heroZoneId,
                                selected_image_url: selectedHeroImage,
                            },
                        } : {}),
                    };

                    console.log(`📤 Generating: angle=${angleId}, format=${formatId}`);

                    // Track which placeholder slots belong to this combo
                    const comboStartIdx = placeholderIdx;

                    try {
                        const result = await generateAdVariations(payload);
                        const resultImages = (result as any).result_images || [];
                        const generatedCopy = (result as any).generated_copy || {};
                        const genId = (result as any).id || '';

                        // Store generation ID for regeneration
                        if (genId) {
                            newGenIdMap[`${angleId}_${formatId}`] = genId;
                        }

                        // Process each variation and update state immediately per image
                        for (let i = 0; i < resultImages.length; i++) {
                            const img = resultImages[i];
                            let imageUrl = 'https://placehold.co/1080x1920/1a1a2e/FFF?text=Generated+Ad';

                            if (img.base64 && img.base64.length > 0) {
                                const mimeType = img.mimeType || 'image/png';
                                imageUrl = `data:${mimeType};base64,${img.base64}`;
                            } else if (img.url) {
                                imageUrl = img.url;
                            }

                            const slotIdx = comboStartIdx + i;
                            const completedResult: PlaceholderResult = {
                                id: img.id || `gen-${angleId}-${formatId}-${img.variation_index}`,
                                angle: angleId,
                                format: formatId,
                                imageUrl: imageUrl,
                                headline: generatedCopy.headline || 'Your Ad',
                                cta: generatedCopy.cta || 'Shop Now',
                                subtext: generatedCopy.subheadline || '',
                                isLoading: false,
                                generationId: genId,
                                variationIndex: img.variation_index || (i + 1),
                            };

                            imagesDone++;
                            const currentDone = imagesDone;

                            // Update individual slot using functional state update
                            setGeneratedResults(prev => {
                                const updated = [...prev];
                                if (slotIdx < updated.length) {
                                    updated[slotIdx] = completedResult;
                                }
                                return updated;
                            });
                            setCompletedCount(currentDone);
                            setGenerationProgress((currentDone / expected) * 100);

                            // Small delay between images to let React render each one
                            if (i < resultImages.length - 1) {
                                await new Promise(r => setTimeout(r, 80));
                            }
                        }

                        // If no images but has copy, fill remaining slots
                        if (resultImages.length === 0 && generatedCopy.headline) {
                            const fallbackResult: PlaceholderResult = {
                                id: `gen-${angleId}-${formatId}-fallback`,
                                angle: angleId,
                                format: formatId,
                                imageUrl: 'https://placehold.co/1080x1920/1a1a2e/FFF?text=Copy+Only',
                                headline: generatedCopy.headline,
                                cta: generatedCopy.cta || 'Shop Now',
                                subtext: generatedCopy.subheadline || '',
                                isLoading: false,
                            };
                            setGeneratedResults(prev => {
                                const updated = [...prev];
                                if (comboStartIdx < updated.length) {
                                    updated[comboStartIdx] = fallbackResult;
                                }
                                return updated;
                            });
                            imagesDone++;
                            setCompletedCount(imagesDone);
                            setGenerationProgress((imagesDone / expected) * 100);
                        }

                        // Move placeholder index forward by 4 (slots per combo)
                        placeholderIdx += 4;

                    } catch (err) {
                        console.error(`❌ Failed for angle=${angleId}, format=${formatId}:`, err);
                        // Mark the 4 placeholder slots for this combo as failed
                        setGeneratedResults(prev => {
                            const updated = [...prev];
                            for (let i = 0; i < 4; i++) {
                                const idx = comboStartIdx + i;
                                if (idx < updated.length && updated[idx].isLoading) {
                                    updated[idx] = {
                                        ...updated[idx],
                                        isLoading: false,
                                        imageUrl: 'https://placehold.co/1080x1920/1a1a2e/FFF?text=Failed',
                                        headline: 'Generation Failed',
                                        cta: '',
                                    };
                                }
                            }
                            return updated;
                        });
                        imagesDone += 4;
                        placeholderIdx += 4;
                        setCompletedCount(imagesDone);
                        setGenerationProgress((imagesDone / expected) * 100);
                    }
                }
            }

            setGenerationIdMap(prev => ({ ...prev, ...newGenIdMap }));
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

    // ============================================
    // P0: GALLERY ACTION HANDLERS
    // ============================================

    // Favorite toggle (client-side for P0)
    const handleToggleFavorite = (resultId: string) => {
        setFavoriteIds(prev => {
            const next = new Set(prev);
            if (next.has(resultId)) {
                next.delete(resultId);
            } else {
                next.add(resultId);
            }
            return next;
        });
    };

    // Regenerate a specific variation
    const handleRegenerate = async (result: PlaceholderResult) => {
        if (!result.generationId || !result.variationIndex) return;
        const rid = result.id;
        setRegeneratingIds(prev => new Set(prev).add(rid));

        try {
            const updated = await regenerateVariation(result.generationId, result.variationIndex);
            const newImages = updated.result_images || [];
            const matchImg = newImages.find(img => img.variation_index === result.variationIndex);

            if (matchImg) {
                let imageUrl = '';
                if ((matchImg as any).base64 && (matchImg as any).base64.length > 0) {
                    imageUrl = `data:${(matchImg as any).mimeType || 'image/png'};base64,${(matchImg as any).base64}`;
                } else if (matchImg.url) {
                    imageUrl = matchImg.url;
                }

                setGeneratedResults(prev => prev.map(r =>
                    r.id === rid ? { ...r, imageUrl, id: matchImg.id || rid } : r
                ));
            }
        } catch (err) {
            console.error('❌ Regeneration failed:', err);
            alert('Regeneration failed. Please try again.');
        } finally {
            setRegeneratingIds(prev => {
                const next = new Set(prev);
                next.delete(rid);
                return next;
            });
        }
    };

    // Delete image (client-side removal)
    const handleDeleteImage = (resultId: string) => {
        setGeneratedResults(prev => prev.filter(r => r.id !== resultId));
        setFavoriteIds(prev => {
            const next = new Set(prev);
            next.delete(resultId);
            return next;
        });
    };

    // Download All as ZIP
    const handleDownloadAllZip = async () => {
        const completedResults = generatedResults.filter(r => !r.isLoading && r.imageUrl);
        if (completedResults.length === 0) return;

        try {
            // Dynamic import JSZip
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();

            for (let i = 0; i < completedResults.length; i++) {
                const result = completedResults[i];
                const angleName = MARKETING_ANGLES.find(a => a.id === result.angle)?.label || result.angle;
                const fileName = `${angleName}_${result.format}_v${result.variationIndex || 1}.png`.replace(/[^a-zA-Z0-9._-]/g, '_');

                try {
                    if (result.imageUrl.startsWith('data:')) {
                        // Base64 data URL
                        const base64 = result.imageUrl.split(',')[1];
                        zip.file(fileName, base64, { base64: true });
                    } else {
                        // Fetch from URL
                        const response = await fetch(result.imageUrl);
                        const blob = await response.blob();
                        zip.file(fileName, blob);
                    }
                } catch (err) {
                    console.error(`Failed to add ${fileName} to ZIP:`, err);
                }
            }

            const content = await zip.generateAsync({ type: 'blob' });
            const url = window.URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ad_variations_${Date.now()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            console.log(`✅ Downloaded ZIP with ${completedResults.length} images`);
        } catch (err) {
            console.error('❌ ZIP download failed:', err);
            alert('ZIP download failed. Please try again.');
        }
    };

    // Helper: group results by angle
    const getResultsGroupedByAngle = () => {
        const groups: Record<string, PlaceholderResult[]> = {};
        for (const result of generatedResults) {
            if (!groups[result.angle]) {
                groups[result.angle] = [];
            }
            groups[result.angle].push(result);
        }
        return groups;
    };

    // Strict product dependency: product is REQUIRED for generation
    const effectiveProductId = activeProductId || productId;
    const heroRequired = heroZoneId && heroProductImages.length > 0;
    const canGenerate = !!effectiveProductId && !!conceptId && selectedAngles.length > 0 && selectedFormats.length > 0
        && (!heroRequired || selectedHeroImage);

    // Compute disabled reason for tooltip
    const getDisabledReason = (): string | null => {
        if (!effectiveProductId) return 'Please select or upload a product first';
        if (!conceptId) return 'Please upload an inspiration ad';
        if (selectedAngles.length === 0) return 'Please select a marketing angle';
        if (selectedFormats.length === 0) return 'Please select an output format';
        if (heroRequired && !selectedHeroImage) return 'Please select a hero image';
        return null;
    };
    const disabledReason = getDisabledReason();
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

                        {/* Product Selection Dropdown */}
                        <div style={{ marginBottom: '12px' }}>
                            <label className={styles.sectionLabel}>Product</label>
                            <ProductDropdown
                                products={catalogProducts}
                                isLoading={catalogLoading}
                                selectedProductId={activeProductId}
                                selectedCollectionId={null}
                                onProductSelect={(product) => {
                                    setActiveProductId(product.id);
                                    handleProductSelect(product);
                                }}
                                isDarkMode={isDarkMode}
                                placeholder="Select Product"
                            />
                        </div>

                        {/* Product Upload — analyze creates product, auto-selects in dropdown */}
                        <ProductUploadSection
                            isDarkMode={isDarkMode}
                            frontImage={frontImage}
                            backImage={backImage}
                            referenceImages={referenceImages}
                            onFrontImageChange={setFrontImage}
                            onBackImageChange={setBackImage}
                            onReferenceImagesChange={setReferenceImages}
                            onAnalyze={handleAnalyze}
                            isAnalyzing={isAnalyzing}
                            isAnalyzed={isAnalyzed}
                            frontImageUrl={fullAnalysisResponse?.front_image_url}
                            backImageUrl={fullAnalysisResponse?.back_image_url}
                        />

                        <AdUploader
                            onUploadSuccess={handleUploadSuccess}
                            isDarkMode={isDarkMode}
                        />

                        {/* Hero Image Selector — shown when concept has a hero zone & product exists */}
                        {heroZoneId && heroProductImages.length > 0 && (
                            <HeroImageSelector
                                productImages={heroProductImages}
                                selectedHeroImage={selectedHeroImage}
                                onSelect={setSelectedHeroImage}
                                heroZoneId={heroZoneId}
                                heroZoneLabel={heroZoneLabel || undefined}
                                isDarkMode={isDarkMode}
                            />
                        )}

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
                        {(showResults || isGenerating) ? (() => {
                            const grouped = getResultsGroupedByAngle();
                            const getCardWidth = (format: string) => {
                                switch (format) {
                                    case 'story': return '180px';
                                    case 'square': return '220px';
                                    case 'portrait': return '200px';
                                    case 'landscape': return '300px';
                                    default: return '220px';
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
                                <div>
                                    {/* Header with Download All */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                        <div>
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

                                        {/* Download All ZIP Button */}
                                        {generatedResults.filter(r => !r.isLoading).length > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleDownloadAllZip}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '10px 18px',
                                                    background: isDarkMode
                                                        ? 'rgba(124, 77, 255, 0.15)'
                                                        : 'rgba(124, 77, 255, 0.1)',
                                                    border: '1px solid rgba(124, 77, 255, 0.3)',
                                                    borderRadius: '10px',
                                                    color: '#7c4dff',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(124, 77, 255, 0.25)';
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = isDarkMode
                                                        ? 'rgba(124, 77, 255, 0.15)'
                                                        : 'rgba(124, 77, 255, 0.1)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <Archive size={16} />
                                                Download All (ZIP)
                                            </button>
                                        )}
                                    </div>

                                    {/* CSS for animations */}
                                    <style>{`
                                    @keyframes spin {
                                        from { transform: rotate(0deg); }
                                        to { transform: rotate(360deg); }
                                    }
                                    .spinner-icon {
                                        animation: spin 1s linear infinite;
                                    }
                                    .ad-card:hover .card-hover-overlay {
                                        opacity: 1 !important;
                                    }
                                    .ad-card {
                                        transition: transform 0.2s ease, box-shadow 0.2s ease;
                                    }
                                    .ad-card:hover {
                                        transform: translateY(-4px);
                                        box-shadow: 0 8px 32px rgba(124, 77, 255, 0.15);
                                    }
                                `}</style>

                                    {/* Grouped by Angle */}
                                    {Object.entries(grouped).map(([angleId, results]) => (
                                        <div key={angleId} style={{ marginBottom: '32px' }}>
                                            {/* Angle Section Header */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                marginBottom: '16px',
                                                paddingBottom: '10px',
                                                borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                                            }}>
                                                <span style={{
                                                    fontSize: '16px',
                                                    fontWeight: 600,
                                                    color: isDarkMode ? '#fff' : '#1a1a2e',
                                                }}>
                                                    {getAngleLabel(angleId)}
                                                </span>
                                                <span style={{
                                                    fontSize: '11px',
                                                    padding: '2px 8px',
                                                    background: 'rgba(124, 77, 255, 0.15)',
                                                    borderRadius: '12px',
                                                    color: '#7c4dff',
                                                    fontWeight: 500,
                                                }}>
                                                    {results.filter(r => !r.isLoading).length}/{results.length}
                                                </span>
                                            </div>

                                            {/* Cards for this angle */}
                                            <div style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '14px',
                                                alignItems: 'flex-start',
                                            }}>
                                                {results.map(result => (
                                                    <div
                                                        key={result.id}
                                                        className="ad-card"
                                                        style={{
                                                            width: getCardWidth(result.format),
                                                            background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
                                                            borderRadius: '12px',
                                                            overflow: 'hidden',
                                                            border: favoriteIds.has(result.id)
                                                                ? '2px solid rgba(255, 59, 128, 0.5)'
                                                                : '1px solid rgba(124, 77, 255, 0.15)',
                                                            flexShrink: 0,
                                                            position: 'relative',
                                                        }}
                                                    >
                                                        {/* Image Container */}
                                                        <div
                                                            style={{
                                                                position: 'relative',
                                                                aspectRatio: getAspectRatio(result.format),
                                                                overflow: 'hidden',
                                                                background: result.isLoading || regeneratingIds.has(result.id)
                                                                    ? 'linear-gradient(135deg, rgba(124, 77, 255, 0.15) 0%, rgba(68, 138, 255, 0.15) 100%)'
                                                                    : '#1a1a2e',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            {(result.isLoading || regeneratingIds.has(result.id)) ? (
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <Loader2
                                                                        size={28}
                                                                        className="spinner-icon"
                                                                        style={{ color: '#7c4dff', marginBottom: '6px' }}
                                                                    />
                                                                    <div style={{
                                                                        fontSize: '11px',
                                                                        color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                                                                    }}>
                                                                        {regeneratingIds.has(result.id) ? 'Regenerating...' : `V${result.variationIndex || '?'}`}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <img
                                                                        src={result.imageUrl}
                                                                        alt={result.headline}
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            objectFit: 'cover',
                                                                        }}
                                                                    />

                                                                    {/* Variation Badge (top-left) */}
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        top: '8px',
                                                                        left: '8px',
                                                                        padding: '2px 7px',
                                                                        background: 'rgba(0,0,0,0.6)',
                                                                        borderRadius: '6px',
                                                                        fontSize: '10px',
                                                                        color: '#fff',
                                                                        fontWeight: 500,
                                                                        backdropFilter: 'blur(4px)',
                                                                    }}>
                                                                        V{result.variationIndex || '?'}
                                                                    </div>

                                                                    {/* Favorite heart (top-right, always visible) */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); handleToggleFavorite(result.id); }}
                                                                        style={{
                                                                            position: 'absolute',
                                                                            top: '8px',
                                                                            right: '8px',
                                                                            width: '28px',
                                                                            height: '28px',
                                                                            borderRadius: '50%',
                                                                            background: favoriteIds.has(result.id)
                                                                                ? 'rgba(255, 59, 128, 0.85)'
                                                                                : 'rgba(0, 0, 0, 0.4)',
                                                                            border: 'none',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.2s ease',
                                                                            backdropFilter: 'blur(4px)',
                                                                        }}
                                                                    >
                                                                        <Heart
                                                                            size={14}
                                                                            color="#fff"
                                                                            fill={favoriteIds.has(result.id) ? '#fff' : 'none'}
                                                                        />
                                                                    </button>

                                                                    {/* Bottom overlay with text + action buttons (on hover) */}
                                                                    <div
                                                                        className="card-hover-overlay"
                                                                        style={{
                                                                            position: 'absolute',
                                                                            bottom: 0,
                                                                            left: 0,
                                                                            right: 0,
                                                                            padding: '40px 10px 10px',
                                                                            background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                                                                            opacity: 0,
                                                                            transition: 'opacity 0.25s ease',
                                                                        }}
                                                                    >
                                                                        {/* Text */}
                                                                        <div style={{
                                                                            fontSize: '12px',
                                                                            fontWeight: 600,
                                                                            color: '#fff',
                                                                            marginBottom: '2px',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap',
                                                                        }}>
                                                                            {result.headline}
                                                                        </div>

                                                                        {/* Action Buttons Row */}
                                                                        <div style={{
                                                                            display: 'flex',
                                                                            gap: '6px',
                                                                            marginTop: '6px',
                                                                        }}>
                                                                            {/* Preview */}
                                                                            <button type="button" onClick={() => setLightboxImage(result.imageUrl)}
                                                                                title="Preview"
                                                                                style={{
                                                                                    width: '30px', height: '30px', borderRadius: '50%',
                                                                                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                    cursor: 'pointer', transition: 'all 0.15s ease',
                                                                                }}
                                                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
                                                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                                                                            >
                                                                                <Eye size={14} color="#fff" />
                                                                            </button>

                                                                            {/* Download */}
                                                                            <button type="button"
                                                                                onClick={() => handleDownloadImage(result.imageUrl, `${result.headline.replace(/[^a-zA-Z0-9]/g, '_')}_v${result.variationIndex}.png`)}
                                                                                title="Download"
                                                                                style={{
                                                                                    width: '30px', height: '30px', borderRadius: '50%',
                                                                                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                    cursor: 'pointer', transition: 'all 0.15s ease',
                                                                                }}
                                                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
                                                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                                                                            >
                                                                                <Download size={14} color="#fff" />
                                                                            </button>

                                                                            {/* Regenerate */}
                                                                            {result.generationId && (
                                                                                <button type="button"
                                                                                    onClick={() => handleRegenerate(result)}
                                                                                    title="Regenerate"
                                                                                    style={{
                                                                                        width: '30px', height: '30px', borderRadius: '50%',
                                                                                        background: 'rgba(124, 77, 255, 0.3)', border: '1px solid rgba(124, 77, 255, 0.5)',
                                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                        cursor: 'pointer', transition: 'all 0.15s ease',
                                                                                    }}
                                                                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124, 77, 255, 0.5)'; }}
                                                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124, 77, 255, 0.3)'; }}
                                                                                >
                                                                                    <RefreshCw size={14} color="#fff" />
                                                                                </button>
                                                                            )}

                                                                            {/* Delete */}
                                                                            <button type="button"
                                                                                onClick={() => handleDeleteImage(result.id)}
                                                                                title="Delete"
                                                                                style={{
                                                                                    width: '30px', height: '30px', borderRadius: '50%',
                                                                                    background: 'rgba(255, 59, 48, 0.2)', border: '1px solid rgba(255, 59, 48, 0.4)',
                                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                    cursor: 'pointer', transition: 'all 0.15s ease',
                                                                                }}
                                                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 59, 48, 0.4)'; }}
                                                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 59, 48, 0.2)'; }}
                                                                            >
                                                                                <Trash2 size={14} color="#fff" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Footer: Format badge */}
                                                        <div
                                                            style={{
                                                                padding: '8px 10px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                borderTop: '1px solid rgba(124, 77, 255, 0.08)',
                                                            }}
                                                        >
                                                            <span style={{
                                                                fontSize: '10px',
                                                                opacity: 0.6,
                                                                color: isDarkMode ? '#fff' : '#1a1a2e'
                                                            }}>
                                                                {result.format.toUpperCase()}
                                                            </span>
                                                            {result.cta && !result.isLoading && (
                                                                <span style={{
                                                                    fontSize: '9px',
                                                                    padding: '2px 6px',
                                                                    background: 'rgba(124, 77, 255, 0.12)',
                                                                    borderRadius: '4px',
                                                                    color: '#7c4dff',
                                                                    fontWeight: 500,
                                                                }}>
                                                                    {result.cta}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })() : (analysisJson || isAnalyzed) ? (
                            <AnalysisStage
                                data={analysisJson}
                                conceptId={conceptId || undefined}
                                onUpdate={setAnalysisJson}
                                isDarkMode={isDarkMode}
                                productJSON={productJSON}
                                fullAnalysisResponse={fullAnalysisResponse}
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

                {/* Right: Generate Button with Tooltip */}
                <div style={{ position: 'relative' }} title={disabledReason || undefined}>
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
                    </button>
                </div>
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
