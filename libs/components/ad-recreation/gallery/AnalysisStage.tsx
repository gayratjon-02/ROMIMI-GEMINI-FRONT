// libs/components/ad-recreation/gallery/AnalysisStage.tsx
// Displays and allows editing of the analysis result
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Save, Loader2, AlertCircle } from 'lucide-react';
import { updateConceptAnalysis } from '@/libs/server/Ad-Recreation/inspiration/inspiration.service';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

interface AnalysisStageProps {
    data: any;
    conceptId?: string;
    onUpdate?: (newData: any) => void;
    isDarkMode?: boolean;
}

const AnalysisStage: React.FC<AnalysisStageProps> = ({
    data,
    conceptId,
    onUpdate,
    isDarkMode = true
}) => {
    const [editedJson, setEditedJson] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Initialize with formatted JSON
    useEffect(() => {
        if (data) {
            setEditedJson(JSON.stringify(data, null, 2));
        }
    }, [data]);

    // Extract key info for summary cards
    const layout = data?.layout || {};
    const visualStyle = data?.visual_style || {};

    const handleSave = async () => {
        // Validate JSON before saving
        let parsedJson: object;
        try {
            parsedJson = JSON.parse(editedJson);
        } catch {
            setErrorMessage('Invalid JSON format. Please check your syntax.');
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
            return;
        }

        if (!conceptId) {
            setErrorMessage('Cannot save: missing concept ID');
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
            return;
        }

        setIsSaving(true);
        setErrorMessage('');

        try {
            const updated = await updateConceptAnalysis(conceptId, parsedJson);
            setSaveStatus('success');
            if (onUpdate) {
                onUpdate(updated.analysis_json || parsedJson);
            }
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err: any) {
            console.error('Save failed:', err);
            setErrorMessage(err.message || 'Failed to save changes');
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.analysisStage}>
            {/* Header */}
            <div className={styles.analysisHeader}>
                <div className={styles.successBadge}>
                    <CheckCircle2 size={24} className={styles.successIcon} />
                    <span>Ad Concept Analyzed Successfully</span>
                </div>
            </div>

            {/* Full width content */}
            <div className={styles.analysisContentFull}>
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
                            <span className={styles.editBadge}>✎ Editable</span>
                        </div>

                        <div className={styles.headerActions}>
                            {saveStatus === 'error' && (
                                <span className={styles.errorText}>
                                    <AlertCircle size={14} />
                                    {errorMessage}
                                </span>
                            )}
                            {saveStatus === 'success' && (
                                <span className={styles.successText}>
                                    <CheckCircle2 size={14} />
                                    Saved!
                                </span>
                            )}
                            <button
                                onClick={handleSave}
                                className={styles.saveButton}
                                disabled={isSaving || !conceptId}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={14} className={styles.spinner} />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={14} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <textarea
                        className={styles.editorTextarea}
                        value={editedJson}
                        onChange={(e) => setEditedJson(e.target.value)}
                        spellCheck={false}
                        placeholder="{ }"
                    />
                </div>
            </div>
        </div>
    );
};

export default AnalysisStage;
