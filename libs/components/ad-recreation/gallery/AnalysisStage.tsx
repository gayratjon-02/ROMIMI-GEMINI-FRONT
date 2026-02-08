// libs/components/ad-recreation/gallery/AnalysisStage.tsx
// Displays the analysis result in a VS Code-like editor style
import React from 'react';
import { CheckCircle2, Copy, Check } from 'lucide-react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

interface AnalysisStageProps {
    data: any;
    imageUrl?: string;
    isDarkMode?: boolean;
}

// Syntax highlight JSON for display
const syntaxHighlight = (json: any): string => {
    if (!json) return '';
    const str = typeof json === 'string' ? json : JSON.stringify(json, null, 2);
    return str
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
            let cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return `<span class="${cls}">${match}</span>`;
        });
};

const AnalysisStage: React.FC<AnalysisStageProps> = ({ data, imageUrl, isDarkMode = true }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Extract key info for summary cards
    const layout = data?.layout || {};
    const visualStyle = data?.visual_style || {};

    return (
        <div className={styles.analysisStage}>
            {/* Header */}
            <div className={styles.analysisHeader}>
                <div className={styles.successBadge}>
                    <CheckCircle2 size={24} className={styles.successIcon} />
                    <span>Ad Concept Analyzed Successfully</span>
                </div>
            </div>

            {/* Two column layout */}
            <div className={styles.analysisContent}>
                {/* Left: Image Preview */}
                {imageUrl && (
                    <div className={styles.previewColumn}>
                        <div className={styles.previewCard}>
                            <div className={styles.previewLabel}>Inspiration Image</div>
                            <img src={imageUrl} alt="Uploaded ad" className={styles.previewImage} />
                        </div>
                    </div>
                )}

                {/* Right: Analysis Data */}
                <div className={styles.dataColumn}>
                    {/* Quick Summary Cards */}
                    <div className={styles.summaryCards}>
                        <div className={styles.summaryCard}>
                            <span className={styles.cardLabel}>Layout</span>
                            <span className={styles.cardValue}>{layout.type || 'Unknown'}</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.cardLabel}>Format</span>
                            <span className={styles.cardValue}>{layout.format || '—'}</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.cardLabel}>Mood</span>
                            <span className={styles.cardValue}>{visualStyle.mood || '—'}</span>
                        </div>
                        <div className={styles.summaryCard}>
                            <span className={styles.cardLabel}>Background</span>
                            <span className={styles.cardValue}>
                                <span
                                    className={styles.colorSwatch}
                                    style={{ backgroundColor: visualStyle.background_hex || '#000' }}
                                />
                                {visualStyle.background_hex || '—'}
                            </span>
                        </div>
                    </div>

                    {/* Code Editor Style JSON */}
                    <div className={styles.codeEditor}>
                        <div className={styles.editorHeader}>
                            <div className={styles.editorTabs}>
                                <span className={styles.tabActive}>analysis.json</span>
                            </div>
                            <button onClick={handleCopy} className={styles.copyButton}>
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <pre
                            className={styles.editorBody}
                            dangerouslySetInnerHTML={{ __html: syntaxHighlight(data) }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisStage;
