'use client';

import React, { useState } from 'react';
import { useTheme } from "@mui/material";
import HomeTop from '@/libs/components/homePage/HomeTop';
import { withAuth } from "@/libs/components/auth/withAuth";
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';
import {
    MOCK_BRANDS,
    MOCK_ANGLES,
    MOCK_FORMATS,
    MOCK_CONCEPT_JSON,
    MOCK_RESULTS,
    Brand,
    MockResult,
} from '@/libs/constants/ad-recreation';

const AdRecreationPage: React.FC = () => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    // ============================================
    // STATE
    // ============================================
    const [selectedBrand, setSelectedBrand] = useState<Brand>(MOCK_BRANDS[0]);
    const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
    const [activeMode, setActiveMode] = useState<'single' | 'batch'>('single');
    const [uploadedFile, setUploadedFile] = useState<string | null>(null);
    const [isAccordionOpen, setIsAccordionOpen] = useState(false);
    const [selectedAngles, setSelectedAngles] = useState<string[]>([]);
    const [selectedFormats, setSelectedFormats] = useState<string[]>(['story']);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [productDetails, setProductDetails] = useState('');

    // ============================================
    // HANDLERS
    // ============================================
    const handleBrandSelect = (brand: Brand) => {
        setSelectedBrand(brand);
        setIsBrandMenuOpen(false);
    };

    const handleUploadClick = () => {
        // Simulate file upload
        setUploadedFile('nike_ad_story.jpg');
        setIsAccordionOpen(true);
    };

    const toggleAngle = (angleId: string) => {
        setSelectedAngles(prev =>
            prev.includes(angleId)
                ? prev.filter(id => id !== angleId)
                : [...prev, angleId]
        );
    };

    const toggleFormat = (formatId: string) => {
        setSelectedFormats(prev =>
            prev.includes(formatId)
                ? prev.filter(id => id !== formatId)
                : [...prev, formatId]
        );
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        // Simulate generation delay
        await new Promise(resolve => setTimeout(resolve, 2500));
        setIsGenerating(false);
        setShowResults(true);
    };

    const canGenerate = uploadedFile && selectedAngles.length > 0 && selectedFormats.length > 0;

    // Group results by angle
    const getResultsByAngle = () => {
        const grouped: Record<string, MockResult[]> = {};
        const filteredResults = MOCK_RESULTS.filter(
            r => selectedAngles.includes(r.angle) && selectedFormats.includes(r.format)
        );

        // If no matching results, show all results for selected angles
        const resultsToShow = filteredResults.length > 0
            ? filteredResults
            : MOCK_RESULTS.filter(r => selectedAngles.includes(r.angle));

        resultsToShow.forEach(result => {
            if (!grouped[result.angle]) {
                grouped[result.angle] = [];
            }
            grouped[result.angle].push(result);
        });
        return grouped;
    };

    const getAngleLabel = (angleId: string) => {
        const angle = MOCK_ANGLES.find(a => a.id === angleId);
        return angle ? `${angle.icon} ${angle.label}` : angleId;
    };

    // Light mode class helper
    const lightClass = !isDarkMode ? styles.light : '';

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className={`${styles.pageWrapper} ${lightClass}`}>
            {/* Left Sidebar - Configuration Zone */}
            <div className={`${styles.sidebar} ${lightClass}`}>
                <div className={styles.sidebarContent}>
                    {/* A. Brand Selector */}
                    <div className={styles.section}>
                        <label className={styles.sectionLabel}>Brand</label>
                        <div className={styles.brandSelector}>
                            <button
                                className={styles.brandDropdown}
                                onClick={() => setIsBrandMenuOpen(!isBrandMenuOpen)}
                            >
                                <div className={styles.brandInfo}>
                                    <span className={styles.brandLogo}>{selectedBrand.logo}</span>
                                    <span className={styles.brandName}>{selectedBrand.name}</span>
                                </div>
                                <svg
                                    className={`${styles.dropdownIcon} ${isBrandMenuOpen ? styles.open : ''}`}
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>

                            {isBrandMenuOpen && (
                                <div className={styles.brandMenu}>
                                    {MOCK_BRANDS.map(brand => (
                                        <button
                                            key={brand.id}
                                            className={`${styles.brandOption} ${selectedBrand.id === brand.id ? styles.selected : ''}`}
                                            onClick={() => handleBrandSelect(brand)}
                                        >
                                            <span>{brand.logo}</span>
                                            <span>{brand.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* B. Mode Toggle */}
                    <div className={styles.section}>
                        <label className={styles.sectionLabel}>Mode</label>
                        <div className={styles.modeToggle}>
                            <button
                                className={`${styles.modeOption} ${activeMode === 'single' ? styles.active : ''}`}
                                onClick={() => setActiveMode('single')}
                            >
                                Single Concept
                            </button>
                            <button
                                className={`${styles.modeOption} ${styles.disabled}`}
                                disabled
                                title="Coming soon in P1"
                            >
                                Batch Mode
                            </button>
                        </div>
                    </div>

                    {/* C. Inspiration Upload */}
                    <div className={styles.section}>
                        <label className={styles.sectionLabel}>Inspiration</label>
                        <div
                            className={`${styles.uploadZone} ${uploadedFile ? styles.hasFile : ''}`}
                            onClick={handleUploadClick}
                        >
                            {uploadedFile ? (
                                <div className={styles.uploadedFile}>
                                    <span className={styles.fileIcon}>📄</span>
                                    <span className={styles.fileName}>{uploadedFile}</span>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.uploadIcon}>☁️</div>
                                    <p className={styles.uploadText}>Drop competitor ad here</p>
                                    <p className={styles.uploadHint}>or click to browse</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* D. Concept JSON Accordion */}
                    {uploadedFile && (
                        <div className={styles.section}>
                            <div className={styles.accordion}>
                                <button
                                    className={styles.accordionHeader}
                                    onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                                >
                                    <span>Analysis Result (JSON)</span>
                                    <svg
                                        className={`${styles.accordionIcon} ${isAccordionOpen ? styles.open : ''}`}
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                                {isAccordionOpen && (
                                    <div className={styles.accordionContent}>
                                        <pre className={styles.codeBlock}>
                                            {JSON.stringify(MOCK_CONCEPT_JSON, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* NEW: Product Details Textarea */}
                    <div className={styles.section}>
                        <label className={styles.sectionLabel}>Product Details</label>
                        <textarea
                            className={styles.productTextarea}
                            placeholder="Describe your product (e.g., Nike Air Zoom, red, lightweight...)"
                            value={productDetails}
                            onChange={(e) => setProductDetails(e.target.value)}
                        />
                    </div>

                    {/* E. Angle Selector */}
                    <div className={styles.section}>
                        <label className={styles.sectionLabel}>Marketing Angles</label>
                        <div className={styles.angleGrid}>
                            {MOCK_ANGLES.map(angle => (
                                <button
                                    key={angle.id}
                                    className={`${styles.angleCard} ${selectedAngles.includes(angle.id) ? styles.selected : ''}`}
                                    onClick={() => toggleAngle(angle.id)}
                                >
                                    <div className={styles.angleIcon}>{angle.icon}</div>
                                    <div className={styles.angleLabel}>{angle.label}</div>
                                    <div className={styles.angleDesc}>{angle.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* F. Format Selector */}
                    <div className={styles.section}>
                        <label className={styles.sectionLabel}>Output Formats</label>
                        <div className={styles.formatRow}>
                            {MOCK_FORMATS.map(format => (
                                <button
                                    key={format.id}
                                    className={`${styles.formatButton} ${selectedFormats.includes(format.id) ? styles.selected : ''}`}
                                    onClick={() => toggleFormat(format.id)}
                                >
                                    <span className={styles.formatLabel}>{format.label}</span>
                                    <span className={styles.formatName}>{format.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* G. Generate Button (Sticky Bottom) */}
                <div className={styles.sidebarFooter}>
                    <button
                        className={`${styles.generateButton} ${isGenerating ? styles.loading : ''}`}
                        onClick={handleGenerate}
                        disabled={!canGenerate || isGenerating}
                    >
                        {isGenerating ? (
                            <>
                                <span className={styles.spinner} />
                                <span>Dreaming...</span>
                            </>
                        ) : (
                            <>
                                <span>✨</span>
                                <span>Generate Ad</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Area */}
            <div className={styles.mainArea}>
                {/* Top Bar */}
                <HomeTop />

                {/* Content Area */}
                <div className={`${styles.contentArea} ${lightClass}`}>
                    {!showResults ? (
                        /* Empty State */
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🎨</div>
                            <h2 className={styles.emptyTitle}>Ready to Recreate</h2>
                            <p className={styles.emptySubtext}>
                                Upload a reference image and select your marketing angles to begin generating stunning ad variations.
                            </p>
                        </div>
                    ) : (
                        /* Results Gallery */
                        <div className={styles.resultsGallery}>
                            <div className={styles.resultsHeader}>
                                <h2 className={styles.resultsTitle}>Generated Ads</h2>
                                <p className={styles.resultsSubtitle}>
                                    {Object.keys(getResultsByAngle()).length} angles • {selectedFormats.length} formats
                                </p>
                            </div>

                            {Object.entries(getResultsByAngle()).map(([angleId, results]) => (
                                <div key={angleId} className={styles.angleGroup}>
                                    <h3 className={styles.angleGroupTitle}>
                                        {getAngleLabel(angleId)}
                                    </h3>
                                    <div className={styles.resultsGrid}>
                                        {results.map(result => (
                                            <div key={result.id} className={styles.resultCard}>
                                                <div
                                                    className={styles.cardImage}
                                                    style={{
                                                        aspectRatio: result.format === 'story' ? '9/16' :
                                                            result.format === 'square' ? '1/1' :
                                                                result.format === 'portrait' ? '4/5' : '16/9'
                                                    }}
                                                >
                                                    <img src={result.imageUrl} alt={result.headline} />
                                                    <div className={styles.cardOverlay}>
                                                        <div className={styles.cardHeadline}>{result.headline}</div>
                                                        <div className={styles.cardSubtext}>{result.subtext}</div>
                                                        <div className={styles.cardCta}>{result.cta}</div>
                                                    </div>
                                                </div>
                                                <div className={styles.cardActions}>
                                                    <button className={styles.actionButton}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                            <polyline points="7 10 12 15 17 10" />
                                                            <line x1="12" y1="15" x2="12" y2="3" />
                                                        </svg>
                                                        Download
                                                    </button>
                                                    <button className={styles.actionButton}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                        </svg>
                                                        Copy Text
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default withAuth(AdRecreationPage);
