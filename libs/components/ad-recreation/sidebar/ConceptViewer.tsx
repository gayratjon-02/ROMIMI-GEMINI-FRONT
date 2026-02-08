// libs/components/ad-recreation/sidebar/ConceptViewer.tsx
// Displays the analyzed concept data in a collapsible accordion with formatted key fields
import React, { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle2, Sparkles } from 'lucide-react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

interface ConceptViewerProps {
    conceptData: {
        headline?: string;
        cta?: string;
        summary?: string;
        visual_description?: string;
        [key: string]: any;
    } | null;
    isDarkMode?: boolean;
}

const ConceptViewer: React.FC<ConceptViewerProps> = ({
    conceptData,
    isDarkMode = true,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Auto-open when data is received
    useEffect(() => {
        if (conceptData && Object.keys(conceptData).length > 0) {
            setIsOpen(true);
        }
    }, [conceptData]);

    if (!conceptData || Object.keys(conceptData).length === 0) {
        return null;
    }

    const headline = conceptData.headline || conceptData.title || '';
    const cta = conceptData.cta || conceptData.call_to_action || '';
    const summary = conceptData.summary || conceptData.visual_description || conceptData.description || '';

    return (
        <div className={styles.section}>
            <div className={styles.accordion}>
                <button
                    className={styles.accordionHeader}
                    onClick={() => setIsOpen(!isOpen)}
                    type="button"
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
                        Analysis Result
                    </span>
                    <ChevronDown
                        className={`${styles.accordionIcon} ${isOpen ? styles.open : ''}`}
                        size={16}
                    />
                </button>

                {isOpen && (
                    <div className={styles.accordionContent}>
                        {/* Formatted Key Fields */}
                        <div className={styles.conceptFields}>
                            {headline && (
                                <div className={styles.conceptField}>
                                    <span className={styles.conceptFieldLabel}>
                                        <Sparkles size={12} /> Headline
                                    </span>
                                    <span className={styles.conceptFieldValue}>{headline}</span>
                                </div>
                            )}

                            {cta && (
                                <div className={styles.conceptField}>
                                    <span className={styles.conceptFieldLabel}>
                                        <Sparkles size={12} /> CTA
                                    </span>
                                    <span className={styles.conceptFieldValue}>{cta}</span>
                                </div>
                            )}

                            {summary && (
                                <div className={styles.conceptField}>
                                    <span className={styles.conceptFieldLabel}>
                                        <Sparkles size={12} /> Summary
                                    </span>
                                    <span className={styles.conceptFieldValueLong}>{summary}</span>
                                </div>
                            )}
                        </div>

                        {/* Raw JSON Collapsible */}
                        <details className={styles.rawJsonDetails}>
                            <summary className={styles.rawJsonSummary}>
                                View Raw JSON
                            </summary>
                            <pre className={styles.codeBlock}>
                                {JSON.stringify(conceptData, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConceptViewer;
