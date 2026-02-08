// libs/components/ad-recreation/gallery/ResultsGrid.tsx
import React from 'react';
import { Download, Copy } from 'lucide-react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';
import { Angle } from '../sidebar/AngleSelector';

export interface MockResult {
    id: string;
    angle: string;
    format: string;
    imageUrl: string;
    headline: string;
    cta: string;
    subtext: string;
}

interface ResultsGridProps {
    results: MockResult[];
    angles: Angle[];
    selectedAngles: string[];
    selectedFormats: string[];
    isDarkMode: boolean;
}

const ResultsGrid: React.FC<ResultsGridProps> = ({
    results,
    angles,
    selectedAngles,
    selectedFormats,
    isDarkMode,
}) => {
    // Group results by angle
    const getResultsByAngle = () => {
        const grouped: Record<string, MockResult[]> = {};
        const filteredResults = results.filter(
            r => selectedAngles.includes(r.angle) && selectedFormats.includes(r.format)
        );

        const resultsToShow = filteredResults.length > 0
            ? filteredResults
            : results.filter(r => selectedAngles.includes(r.angle));

        resultsToShow.forEach(result => {
            if (!grouped[result.angle]) {
                grouped[result.angle] = [];
            }
            grouped[result.angle].push(result);
        });
        return grouped;
    };

    const getAngleLabel = (angleId: string) => {
        const angle = angles.find(a => a.id === angleId);
        return angle ? `${angle.icon} ${angle.label}` : angleId;
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

    // Download image function
    const handleDownload = async (result: MockResult) => {
        try {
            let blob: Blob;
            const fileName = `${result.headline.replace(/[^a-zA-Z0-9]/g, '_')}_${result.id}.png`;

            if (result.imageUrl.startsWith('data:')) {
                // Base64 data URI - convert to blob
                const response = await fetch(result.imageUrl);
                blob = await response.blob();
            } else {
                // Regular URL - fetch and convert to blob
                const response = await fetch(result.imageUrl);
                blob = await response.blob();
            }

            // Create download link
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

    // Copy text function
    const handleCopyText = (result: MockResult) => {
        const text = `${result.headline}\n${result.subtext}\n${result.cta}`;
        navigator.clipboard.writeText(text).then(() => {
            console.log('✅ Text copied to clipboard');
            alert('Ad copy copied to clipboard!');
        }).catch(err => {
            console.error('❌ Copy failed:', err);
        });
    };

    const groupedResults = getResultsByAngle();

    return (
        <div className={styles.resultsGallery}>
            <div className={styles.resultsHeader}>
                <h2 className={styles.resultsTitle}>Generated Ads</h2>
                <p className={styles.resultsSubtitle}>
                    {Object.keys(groupedResults).length} angles • {selectedFormats.length} formats
                </p>
            </div>

            {Object.entries(groupedResults).map(([angleId, angleResults]) => (
                <div key={angleId} className={styles.angleGroup}>
                    <h3 className={styles.angleGroupTitle}>
                        {getAngleLabel(angleId)}
                    </h3>
                    <div className={styles.resultsGrid}>
                        {angleResults.map(result => (
                            <div key={result.id} className={styles.resultCard}>
                                <div
                                    className={styles.cardImage}
                                    style={{ aspectRatio: getAspectRatio(result.format) }}
                                >
                                    <img src={result.imageUrl} alt={result.headline} />
                                    <div className={styles.cardOverlay}>
                                        <div className={styles.cardHeadline}>{result.headline}</div>
                                        <div className={styles.cardSubtext}>{result.subtext}</div>
                                        <div className={styles.cardCta}>{result.cta}</div>
                                    </div>
                                </div>
                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.actionButton}
                                        type="button"
                                        onClick={() => handleDownload(result)}
                                    >
                                        <Download size={14} />
                                        Download
                                    </button>
                                    <button
                                        className={styles.actionButton}
                                        type="button"
                                        onClick={() => handleCopyText(result)}
                                    >
                                        <Copy size={14} />
                                        Copy Text
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ResultsGrid;
