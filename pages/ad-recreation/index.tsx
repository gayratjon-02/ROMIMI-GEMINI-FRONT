// pages/ad-recreation/index.tsx
// Controller Pattern: State management only, UI delegated to components
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from "@mui/material";
import { LogOut } from 'lucide-react';
import HomeTop from '@/libs/components/homePage/HomeTop';
import { withAuth } from "@/libs/components/auth/withAuth";
import { logout, getUserInfo, UserInfo } from '@/libs/server/HomePage/signup';
import { generateAdVariations, GenerationResult, AdCopyResult } from '@/libs/server/Ad-Recreation/generation/generation.service';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

// Sidebar Components
import BrandSelect from '@/libs/components/ad-recreation/sidebar/BrandSelect';
import ModeToggle from '@/libs/components/ad-recreation/sidebar/ModeToggle';
import AdUploader from '@/libs/components/ad-recreation/sidebar/AdUploader';
import ProductForm from '@/libs/components/ad-recreation/sidebar/ProductForm';
import AngleSelector, { Angle } from '@/libs/components/ad-recreation/sidebar/AngleSelector';
import FormatSelector, { Format } from '@/libs/components/ad-recreation/sidebar/FormatSelector';

// Layout Components
import BottomActionBar from '@/libs/components/ad-recreation/layout/BottomActionBar';

// Gallery Components
import EmptyState from '@/libs/components/ad-recreation/gallery/EmptyState';
import AnalysisStage from '@/libs/components/ad-recreation/gallery/AnalysisStage';
import ResultsGrid, { MockResult } from '@/libs/components/ad-recreation/gallery/ResultsGrid';

// ============================================
// MOCK DATA CONSTANTS
// ============================================

const MOCK_ANGLES: Angle[] = [
    { id: 'problem_solution', label: 'Problem / Solution', desc: 'Solve a pain point', icon: '💡' },
    { id: 'social_proof', label: 'Social Proof', desc: 'Customer reviews & trust', icon: '⭐' },
    { id: 'fomo', label: 'FOMO', desc: 'Urgency & scarcity', icon: '⏰' },
    { id: 'minimalist', label: 'Minimalist', desc: 'Clean & elegant design', icon: '✨' },
];

const MOCK_FORMATS: Format[] = [
    { id: 'story', label: '9:16', name: 'Story', width: 1080, height: 1920 },
    { id: 'square', label: '1:1', name: 'Post', width: 1080, height: 1080 },
    { id: 'portrait', label: '4:5', name: 'Portrait', width: 1080, height: 1350 },
    { id: 'landscape', label: '16:9', name: 'Landscape', width: 1920, height: 1080 },
];

// ============================================
// MAIN PAGE CONTROLLER
// ============================================
const AdRecreationPage: React.FC = () => {
    const router = useRouter();
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    // ============================================
    // STATE (The Controller's Responsibility)
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

    // NEW: Real generation results
    const [generatedResults, setGeneratedResults] = useState<MockResult[]>([]);

    // Load user info on mount
    useEffect(() => {
        const userInfo = getUserInfo();
        setUser(userInfo);
    }, []);

    // ============================================
    // HANDLERS (Business Logic)
    // ============================================

    // Called when inspiration image is successfully uploaded and analyzed
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

    const handleGenerate = async () => {
        console.log('🚀 ========== GENERATE AD CLICKED ==========');

        // Clear previous error
        setErrorMessage(null);

        // ============================================
        // VALIDATION
        // ============================================
        if (!selectedBrandId) {
            setErrorMessage('Please select a brand');
            console.warn('⚠️ Please select a brand');
            return;
        }
        if (!conceptId) {
            setErrorMessage('Please upload an inspiration ad first');
            console.warn('⚠️ Please upload an inspiration ad first');
            return;
        }
        if (!productDetails.trim()) {
            setErrorMessage('Please enter product details');
            console.warn('⚠️ Please enter product details');
            return;
        }
        if (selectedAngles.length === 0) {
            setErrorMessage('Please select at least one marketing angle');
            console.warn('⚠️ Please select at least one marketing angle');
            return;
        }
        if (selectedFormats.length === 0) {
            setErrorMessage('Please select at least one format');
            console.warn('⚠️ Please select at least one format');
            return;
        }

        // ============================================
        // EXECUTION
        // ============================================
        setIsGenerating(true);
        setGenerationProgress(0);
        setGeneratedResults([]);

        // Simulate progress while waiting
        const progressInterval = setInterval(() => {
            setGenerationProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.random() * 15;
            });
        }, 400);

        try {
            // Build payload
            const payload = {
                brand_id: selectedBrandId,
                concept_id: conceptId,
                product_input: productDetails,
                marketing_angle_id: selectedAngles[0],
                format_id: selectedFormats[0],
            };

            console.log('📤 SENDING PAYLOAD:', JSON.stringify(payload, null, 2));

            // Call real API
            const result = await generateAdVariations(payload);

            console.log('📥 RECEIVED RESPONSE:', JSON.stringify(result, null, 2));

            // Parse result into MockResult format for ResultsGrid
            const resultImages = (result as any).result_images || [];
            const generatedCopy = (result as any).generated_copy || {};

            console.log('🖼️ Result Images:', resultImages);
            console.log('📝 Generated Copy:', generatedCopy);

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

            // Build results for display
            const newResults: MockResult[] = resultImages.map((img: any, index: number) => {
                // Determine image source: URL, base64, or placeholder
                let imageUrl = 'https://placehold.co/1080x1920/1a1a2e/FFF?text=Generated+Ad';

                console.log(`🖼️ Processing image ${index}:`, {
                    hasUrl: !!img.url,
                    hasBase64: !!img.base64,
                    base64Length: img.base64?.length || 0,
                    url: img.url,
                });

                if (img.base64 && img.base64.length > 0) {
                    // Prefer base64 data URI (more reliable)
                    const mimeType = img.mimeType || 'image/png';
                    imageUrl = `data:${mimeType};base64,${img.base64}`;
                    console.log(`✅ Using base64 image (${(img.base64.length / 1024).toFixed(1)} KB)`);
                } else if (img.url) {
                    imageUrl = img.url;
                    console.log(`✅ Using URL: ${img.url}`);
                } else {
                    console.warn(`⚠️ No image data for index ${index}, using placeholder`);
                }

                // Convert aspect ratio format to format ID
                const formatId = aspectRatioToFormat(img.format) || selectedFormats[0];

                return {
                    id: img.id || `gen-${index}`,
                    angle: img.angle || selectedAngles[0],
                    format: formatId,
                    imageUrl: imageUrl,
                    headline: generatedCopy.headline || 'Your Ad Headline',
                    cta: generatedCopy.cta || 'Shop Now',
                    subtext: generatedCopy.subheadline || 'Generated ad copy',
                };
            });

            // If no images were returned, still show the copy
            if (newResults.length === 0 && generatedCopy.headline) {
                newResults.push({
                    id: result.id || 'gen-1',
                    angle: selectedAngles[0],
                    format: selectedFormats[0],
                    imageUrl: 'https://placehold.co/1080x1920/1a1a2e/FFF?text=Copy+Generated',
                    headline: generatedCopy.headline,
                    cta: generatedCopy.cta || 'Shop Now',
                    subtext: generatedCopy.subheadline,
                });
            }

            console.log('✅ Processed Results:', newResults);

            setGeneratedResults(newResults);
            clearInterval(progressInterval);
            setGenerationProgress(100);
            setShowResults(true);
        } catch (error: any) {
            console.error('❌ Generation failed:', error);
            setErrorMessage(error.message || 'Generation failed. Please try again.');
            clearInterval(progressInterval);
            setGenerationProgress(0);
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

    // Determine current status
    const getStatus = (): 'ready' | 'processing' | 'complete' | 'error' => {
        if (isGenerating) return 'processing';
        if (showResults) return 'complete';
        return 'ready';
    };

    // ============================================
    // RENDER (Layout Orchestration)
    // ============================================
    return (
        <>
            <div className={`${styles.pageWrapper} ${lightClass}`} style={{ paddingBottom: 80 }}>
                {/* LEFT SIDEBAR - Configuration Zone */}
                <div className={`${styles.sidebar} ${lightClass}`} style={{ height: 'calc(100vh - 80px)' }}>
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

                        <AngleSelector
                            angles={MOCK_ANGLES}
                            selected={selectedAngles}
                            onChange={handleAngleToggle}
                            isDarkMode={isDarkMode}
                        />

                        <FormatSelector
                            formats={MOCK_FORMATS}
                            selected={selectedFormats}
                            onChange={handleFormatToggle}
                            isDarkMode={isDarkMode}
                        />
                    </div>
                </div>

                {/* MAIN AREA - Results Zone */}
                <div className={styles.mainArea}>
                    <HomeTop />

                    <div className={`${styles.contentArea} ${lightClass}`} style={{ paddingBottom: 100 }}>
                        {/* Error Message Display */}
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

                        {showResults ? (
                            <ResultsGrid
                                results={generatedResults.length > 0 ? generatedResults : []}
                                angles={MOCK_ANGLES}
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

            {/* BOTTOM ACTION BAR - Fixed at bottom */}
            <BottomActionBar
                status={getStatus()}
                statusMessage={isGenerating ? 'Generating your ad...' : undefined}
                progress={generationProgress}
                isGenerating={isGenerating}
                canGenerate={!!canGenerate}
                onGenerate={handleGenerate}
                onLogout={handleLogout}
                isDarkMode={isDarkMode}
            />
        </>
    );
};

export default withAuth(AdRecreationPage);
