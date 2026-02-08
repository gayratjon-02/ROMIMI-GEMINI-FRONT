// pages/ad-recreation/index.tsx
// Controller Pattern: State management only, UI delegated to components
'use client';

import React, { useState } from 'react';
import { useTheme } from "@mui/material";
import HomeTop from '@/libs/components/homePage/HomeTop';
import { withAuth } from "@/libs/components/auth/withAuth";
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

// Sidebar Components
import BrandSelect, { Brand } from '@/libs/components/ad-recreation/sidebar/BrandSelect';
import ModeToggle from '@/libs/components/ad-recreation/sidebar/ModeToggle';
import AdUploader from '@/libs/components/ad-recreation/sidebar/AdUploader';
import ConceptJson from '@/libs/components/ad-recreation/sidebar/ConceptJson';
import ProductForm from '@/libs/components/ad-recreation/sidebar/ProductForm';
import AngleSelector, { Angle } from '@/libs/components/ad-recreation/sidebar/AngleSelector';
import FormatSelector, { Format } from '@/libs/components/ad-recreation/sidebar/FormatSelector';
import GenerateBtn from '@/libs/components/ad-recreation/sidebar/GenerateBtn';

// Gallery Components
import EmptyState from '@/libs/components/ad-recreation/gallery/EmptyState';
import ResultsGrid, { MockResult } from '@/libs/components/ad-recreation/gallery/ResultsGrid';

// ============================================
// MOCK DATA CONSTANTS
// ============================================
const MOCK_BRANDS: Brand[] = [
    { id: 'nike', name: 'Nike', logo: '🏃' },
    { id: 'adidas', name: 'Adidas', logo: '⚽' },
    { id: 'puma', name: 'Puma', logo: '🐆' },
    { id: 'apple', name: 'Apple', logo: '🍎' },
];

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

const MOCK_CONCEPT_JSON = {
    zones: {
        headline: { position: 'top', text: 'STOP SETTLING FOR HEAVY SHOES', style: 'bold_uppercase', color: '#FFFFFF' },
        image: { position: 'center', type: 'product_hero', subject: 'Nike Air Zoom running shoe', background: 'gradient_dark' },
        cta: { position: 'bottom', text: 'RUN FASTER NOW', style: 'button_primary', color: '#FF5722' }
    },
    style: { palette: ['#1a1a1a', '#ffffff', '#ff5722'], mood: 'energetic', typography: 'modern_sans' }
};

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
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    // ============================================
    // STATE (The Controller's Responsibility)
    // ============================================
    const [selectedBrand, setSelectedBrand] = useState<Brand>(MOCK_BRANDS[0]);
    const [activeMode, setActiveMode] = useState<'single' | 'batch'>('single');
    const [uploadedFile, setUploadedFile] = useState<string | null>(null);
    const [productDetails, setProductDetails] = useState('');
    const [selectedAngles, setSelectedAngles] = useState<string[]>([]);
    const [selectedFormats, setSelectedFormats] = useState<string[]>(['story']);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // ============================================
    // HANDLERS (Business Logic)
    // ============================================
    const handleUpload = () => {
        // TODO: Implement real file upload
        setUploadedFile('nike_ad_story.jpg');
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
        // TODO: Call real API
        await new Promise(resolve => setTimeout(resolve, 2500));
        setIsGenerating(false);
        setShowResults(true);
    };

    const canGenerate = uploadedFile && selectedAngles.length > 0 && selectedFormats.length > 0;
    const lightClass = !isDarkMode ? styles.light : '';

    // ============================================
    // RENDER (Layout Orchestration)
    // ============================================
    return (
        <div className={`${styles.pageWrapper} ${lightClass}`}>
            {/* LEFT SIDEBAR - Configuration Zone */}
            <div className={`${styles.sidebar} ${lightClass}`}>
                <div className={styles.sidebarContent}>
                    <BrandSelect
                        brands={MOCK_BRANDS}
                        selectedBrand={selectedBrand}
                        onSelect={setSelectedBrand}
                        isDarkMode={isDarkMode}
                    />

                    <ModeToggle
                        activeMode={activeMode}
                        onChange={setActiveMode}
                        isDarkMode={isDarkMode}
                    />

                    <AdUploader
                        uploadedFile={uploadedFile}
                        onUpload={handleUpload}
                        isDarkMode={isDarkMode}
                    />

                    <ConceptJson
                        conceptData={MOCK_CONCEPT_JSON}
                        isVisible={!!uploadedFile}
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

                <GenerateBtn
                    isLoading={isGenerating}
                    disabled={!canGenerate}
                    onClick={handleGenerate}
                />
            </div>

            {/* MAIN AREA - Results Zone */}
            <div className={styles.mainArea}>
                <HomeTop />

                <div className={`${styles.contentArea} ${lightClass}`}>
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
    );
};

export default withAuth(AdRecreationPage);
