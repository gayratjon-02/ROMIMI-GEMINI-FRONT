// libs/components/ad-recreation/gallery/AnalysisStage.tsx
// Displays Product JSON and Concept JSON with switchable tabs
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Save, Loader2, AlertCircle, Package, Palette } from 'lucide-react';
import { updateConceptAnalysis } from '@/libs/server/Ad-Recreation/inspiration/inspiration.service';
import { updateAdProductAnalysis } from '@/libs/server/Ad-Recreation/products/ad-product.service';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

interface AnalysisStageProps {
    data: any;                          // Concept analysis JSON
    conceptId?: string;
    onUpdate?: (newData: any) => void;
    isDarkMode?: boolean;
    productJSON?: any;                  // Product analysis JSON (from ProductContext)
    fullAnalysisResponse?: any;         // Full analysis response (from ProductContext)
    productId?: string;                 // Ad product ID for saving product JSON changes
    onProductUpdate?: (newData: any) => void; // Callback when product JSON is saved
}

type ActiveTab = 'concept' | 'product';

const AnalysisStage: React.FC<AnalysisStageProps> = ({
    data,
    conceptId,
    onUpdate,
    isDarkMode = true,
    productJSON,
    fullAnalysisResponse,
    productId,
    onProductUpdate,
}) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('concept');
    const [editedConceptJson, setEditedConceptJson] = useState('');
    const [editedProductJson, setEditedProductJson] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Initialize concept JSON
    useEffect(() => {
        if (data) {
            setEditedConceptJson(JSON.stringify(data, null, 2));
        }
    }, [data]);

    // Initialize product JSON
    useEffect(() => {
        if (fullAnalysisResponse?.analysis) {
            setEditedProductJson(JSON.stringify(fullAnalysisResponse.analysis, null, 2));
        } else if (productJSON) {
            setEditedProductJson(JSON.stringify(productJSON, null, 2));
        }
    }, [productJSON, fullAnalysisResponse]);

    // Auto-switch to product tab when product is analyzed but no concept yet
    useEffect(() => {
        if (productJSON && !data) {
            setActiveTab('product');
        }
    }, [productJSON, data]);

    // Extract key info for concept summary cards
    const layout = data?.layout || {};
    const visualStyle = data?.visual_style || {};
    const contentPattern = data?.content_pattern || {};
    const background = visualStyle.background || {};

    // Extract key info for product summary cards
    const productAnalysis = fullAnalysisResponse?.analysis || {};
    const generalInfo = productAnalysis.general_info || {};
    const colors = productAnalysis.colors || {};

    const hasProduct = !!productJSON || !!fullAnalysisResponse?.analysis;
    const hasConcept = !!data;

    const handleSaveConcept = async () => {
        let parsedJson: object;
        try {
            parsedJson = JSON.parse(editedConceptJson);
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

    const handleSaveProduct = async () => {
        let parsedJson: object;
        try {
            parsedJson = JSON.parse(editedProductJson);
        } catch {
            setErrorMessage('Invalid JSON format. Please check your syntax.');
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
            return;
        }

        if (!productId) {
            setErrorMessage('Cannot save: missing product ID');
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
            return;
        }

        setIsSaving(true);
        setErrorMessage('');

        try {
            await updateAdProductAnalysis(productId, parsedJson);
            setSaveStatus('success');
            if (onProductUpdate) {
                onProductUpdate(parsedJson);
            }
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err: any) {
            console.error('Product save failed:', err);
            setErrorMessage(err.message || 'Failed to save changes');
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    const currentJson = activeTab === 'concept' ? editedConceptJson : editedProductJson;
    const setCurrentJson = activeTab === 'concept' ? setEditedConceptJson : setEditedProductJson;

    return (
        <div className={styles.analysisStage}>
            {/* Full width content — JSON editor only */}
            <div className={styles.analysisContentFull}>
                <div className={styles.codeEditor}>
                    <div className={styles.editorHeader}>
                        <div className={styles.editorTabs}>
                            {/* Product JSON Tab */}
                            {hasProduct && (
                                <span
                                    className={activeTab === 'product' ? styles.tabActive : styles.tabInactive}
                                    onClick={() => setActiveTab('product')}
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <Package size={13} />
                                    product.json
                                </span>
                            )}
                            {/* Concept JSON Tab */}
                            {hasConcept && (
                                <span
                                    className={activeTab === 'concept' ? styles.tabActive : styles.tabInactive}
                                    onClick={() => setActiveTab('concept')}
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <Palette size={13} />
                                    concept.json
                                </span>
                            )}
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
                            {activeTab === 'concept' && (
                                <button
                                    onClick={handleSaveConcept}
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
                            )}
                            {activeTab === 'product' && (
                                <button
                                    onClick={handleSaveProduct}
                                    className={styles.saveButton}
                                    disabled={isSaving || !productId}
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
                            )}
                        </div>
                    </div>

                    <textarea
                        className={styles.editorTextarea}
                        value={currentJson}
                        onChange={(e) => setCurrentJson(e.target.value)}
                        spellCheck={false}
                        placeholder="{ }"
                    />
                </div>
            </div>
        </div>
    );
};

export default AnalysisStage;
