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
    // Filter results based on selected angles and formats
    const filteredResults = results.filter(
        r => selectedAngles.includes(r.angle) && selectedFormats.includes(r.format)
    );

    const resultsToShow = filteredResults.length > 0 ? filteredResults : results;

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

    const getCardWidth = (format: string) => {
        switch (format) {
            case 'story': return '200px';
            case 'square': return '250px';
            case 'portrait': return '220px';
            case 'landscape': return '320px';
            default: return '250px';
        }
    };

    // Download image function
    const handleDownload = async (result: MockResult) => {
        try {
            let blob: Blob;
            const fileName = `${result.headline.replace(/[^a-zA-Z0-9]/g, '_')}_${result.id}.png`;

            if (result.imageUrl.startsWith('data:')) {
                const response = await fetch(result.imageUrl);
                blob = await response.blob();
            } else {
                const response = await fetch(result.imageUrl);
                blob = await response.blob();
            }

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

    return (
        <div style={{ padding: '0' }}>
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
                    {resultsToShow.length} variations • {selectedAngles.length} angles • {selectedFormats.length} formats
                </p>
            </div>

            {/* Horizontal Flex-Wrap Grid */}
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    alignItems: 'flex-start',
                }}
            >
                {resultsToShow.map(result => (
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
                                background: '#1a1a2e',
                            }}
                        >
                            <img
                                src={result.imageUrl}
                                alt={result.headline}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                            {/* Overlay with text */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    padding: '12px',
                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                }}
                            >
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
                            </div>
                        </div>

                        {/* Angle Badge + Actions */}
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
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => handleDownload(result)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '4px 8px',
                                        background: 'rgba(124, 77, 255, 0.1)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: '#7c4dff',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Download size={12} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCopyText(result)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '4px 8px',
                                        background: 'rgba(124, 77, 255, 0.1)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: '#7c4dff',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Copy size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResultsGrid;
