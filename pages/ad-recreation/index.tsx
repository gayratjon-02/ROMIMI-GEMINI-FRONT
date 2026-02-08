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
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

// Sidebar Components
import BrandSelect from '@/libs/components/ad-recreation/sidebar/BrandSelect';
import ModeToggle from '@/libs/components/ad-recreation/sidebar/ModeToggle';
import AdUploader from '@/libs/components/ad-recreation/sidebar/AdUploader';
import ConceptJson from '@/libs/components/ad-recreation/sidebar/ConceptJson';
import ProductForm from '@/libs/components/ad-recreation/sidebar/ProductForm';
import AngleSelector, { Angle } from '@/libs/components/ad-recreation/sidebar/AngleSelector';
import FormatSelector, { Format } from '@/libs/components/ad-recreation/sidebar/FormatSelector';

// Layout Components
import BottomActionBar from '@/libs/components/ad-recreation/layout/BottomActionBar';

// Gallery Components
import EmptyState from '@/libs/components/ad-recreation/gallery/EmptyState';
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

const MOCK_RESULTS: MockResult[] = [
    { id: '1', angle: 'problem_solution', format: 'story', imageUrl: 'https://placehold.co/1080x1920/1a1a2e/FFF?text=Nike+Air+Zoom', headline: 'STOP SETTLING FOR HEAVY SHOES', cta: 'RUN FASTER NOW', subtext: 'Feel the difference with 40% lighter soles' },
    { id: '2', angle: 'social_proof', format: 'story', imageUrl: 'https://placehold.co/1080x1920/1a2e1a/FFF?text=5+Star+Reviews', headline: 'TRUSTED BY 10M+ RUNNERS', cta: 'JOIN THE MOVEMENT', subtext: '★★★★★ 4.9/5 from verified buyers' },
    { id: '3', angle: 'fomo', format: 'square', imageUrl: 'https://placehold.co/1080x1080/2e1a1a/FFF?text=Limited+Edition', headline: 'ONLY 48 HOURS LEFT', cta: 'GRAB YOURS NOW', subtext: '73% already sold out' },
    { id: '4', angle: 'minimalist', format: 'portrait', imageUrl: 'https://placehold.co/1080x1350/0a0a14/FFF?text=Air+Zoom', headline: 'AIR ZOOM', cta: 'DISCOVER', subtext: 'Precision engineered for speed' },
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
                ? prev.filter(id => id !== angleId)
                : [...prev, angleId]
        );
    };

    const handleFormatToggle = (formatId: string) => {
        setSelectedFormats(prev =>
            prev.includes(formatId)
                ? prev.filter(id => id !== formatId)
                : [...prev, formatId]
        );
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGenerationProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setGenerationProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.random() * 15;
            });
        }, 400);

        // TODO: Call real API
        await new Promise(resolve => setTimeout(resolve, 2500));

        clearInterval(progressInterval);
        setGenerationProgress(100);
        setIsGenerating(false);
        setShowResults(true);
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

                        <ConceptJson
                            conceptData={analysisJson || {}}
                            isVisible={!!analysisJson}
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

                    {/* Sidebar Footer with User Profile */}
                    <div className={styles.sidebarFooter}>
                        <div className={styles.userProfileCard}>
                            <div className={styles.userProfileAvatar}>
                                <span>{user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}</span>
                            </div>
                            <div className={styles.userProfileInfo}>
                                <span className={styles.userProfileName}>
                                    {user?.name || user?.email?.split('@')[0] || 'User'}
                                </span>
                                <span className={styles.userProfilePlan}>Pro Plan</span>
                            </div>
                            <button
                                className={styles.logoutBtnSmall}
                                onClick={handleLogout}
                                type="button"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* MAIN AREA - Results Zone */}
                <div className={styles.mainArea}>
                    <HomeTop />

                    <div className={`${styles.contentArea} ${lightClass}`} style={{ paddingBottom: 100 }}>
                        {!showResults ? (
                            <EmptyState isDarkMode={isDarkMode} />
                        ) : (
                            <ResultsGrid
                                results={MOCK_RESULTS}
                                angles={MOCK_ANGLES}
                                selectedAngles={selectedAngles}
                                selectedFormats={selectedFormats}
                                isDarkMode={isDarkMode}
                            />
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
                isDarkMode={isDarkMode}
            />
        </>
    );
};

export default withAuth(AdRecreationPage);
