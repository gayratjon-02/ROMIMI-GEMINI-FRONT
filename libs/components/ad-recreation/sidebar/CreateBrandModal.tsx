// libs/components/ad-recreation/sidebar/CreateBrandModal.tsx
// 2-Step Brand Setup Wizard with AI-powered playbook analysis
import React, { useState, useCallback, useRef } from 'react';
import { X, Loader2, Upload, FileText, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import {
    analyzeBrandOnly,
    confirmAndCreateBrand,
    AdBrand,
    BrandPlaybookJson,
} from '@/libs/server/Ad-Recreation/brand/brand.service';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

interface CreateBrandModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (newBrand: AdBrand) => void;
    isDarkMode?: boolean;
}

type WizardStep = 'input' | 'verify';
type InputTab = 'file' | 'text';

const CreateBrandModal: React.FC<CreateBrandModalProps> = ({
    isOpen,
    onClose,
    onCreated,
    isDarkMode = true,
}) => {
    // Wizard state
    const [step, setStep] = useState<WizardStep>('input');
    const [inputTab, setInputTab] = useState<InputTab>('file');

    // Form fields - Step 1
    const [name, setName] = useState('');
    const [industry, setIndustry] = useState('');
    const [website, setWebsite] = useState('');
    const [currency, setCurrency] = useState('GBP');
    const [file, setFile] = useState<File | null>(null);
    const [textContent, setTextContent] = useState('');

    // Step 2 data (playbook only - no brand created yet)
    const [playbook, setPlaybook] = useState<BrandPlaybookJson | null>(null);
    const [playbookJson, setPlaybookJson] = useState('');

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [jsonError, setJsonError] = useState<string | null>(null);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset form
    const resetForm = () => {
        setStep('input');
        setInputTab('file');
        setName('');
        setIndustry('');
        setWebsite('');
        setCurrency('GBP');
        setFile(null);
        setTextContent('');
        setPlaybook(null);
        setPlaybookJson('');
        setError(null);
        setJsonError(null);
    };

    // Handle file drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            const allowedTypes = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain',
            ];
            if (allowedTypes.includes(droppedFile.type)) {
                setFile(droppedFile);
                setError(null);
            } else {
                setError('Only PDF, DOCX, or TXT files are allowed');
            }
        }
    }, []);

    if (!isOpen) return null;

    // Handle file select
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
        }
    };

    // Validate URL
    const isValidUrl = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    // Step 1: Handle Analyze (NO brand creation)
    const handleAnalyze = async () => {
        setError(null);

        // Validation
        if (!name.trim()) {
            setError('Brand name is required');
            return;
        }
        if (!industry.trim()) {
            setError('Industry is required');
            return;
        }
        if (!website.trim()) {
            setError('Website URL is required');
            return;
        }
        if (!isValidUrl(website)) {
            setError('Please enter a valid URL (e.g., https://example.com)');
            return;
        }

        // Must have file OR text
        if (inputTab === 'file' && !file) {
            setError('Please upload a brand playbook file');
            return;
        }
        if (inputTab === 'text' && !textContent.trim()) {
            setError('Please enter a brand description');
            return;
        }

        setIsLoading(true);
        try {
            // Only analyze - NO brand creation yet
            const result = await analyzeBrandOnly({
                name: name.trim(),
                website: website.trim(),
                file: inputTab === 'file' ? file || undefined : undefined,
                text_content: inputTab === 'text' ? textContent.trim() : undefined,
            });

            // Move to Step 2 with playbook (no brandId yet)
            setPlaybook(result.playbook);
            setPlaybookJson(JSON.stringify(result.playbook, null, 2));
            setStep('verify');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze brand');
        } finally {
            setIsLoading(false);
        }
    };

    // Validate JSON
    const validateJson = (json: string): boolean => {
        try {
            JSON.parse(json);
            setJsonError(null);
            return true;
        } catch (e) {
            setJsonError('Invalid JSON format');
            return false;
        }
    };

    // Step 2: Handle Save (NOW creates brand with playbook)
    const handleSave = async () => {
        if (!validateJson(playbookJson)) {
            return;
        }

        setIsLoading(true);
        try {
            const parsedPlaybook = JSON.parse(playbookJson);

            // NOW create brand with the edited playbook
            const brand = await confirmAndCreateBrand(
                name.trim(),
                website.trim(),
                industry.trim(),
                currency,
                parsedPlaybook
            );

            // Success - notify parent and close
            onCreated(brand);
            resetForm();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save brand');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isLoading) {
            resetForm();
            onClose();
        }
    };

    // Go back to Step 1
    const handleBack = () => {
        setStep('input');
        setError(null);
    };

    // Can proceed check
    const canAnalyze = name.trim() && industry.trim() && website.trim() && (
        (inputTab === 'file' && file) ||
        (inputTab === 'text' && textContent.trim())
    );

    return (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            <div
                className={`${styles.modalCard} ${!isDarkMode ? styles.light : ''}`}
                style={{ maxWidth: step === 'verify' ? '700px' : '500px', transition: 'max-width 0.3s ease' }}
            >
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {step === 'verify' && (
                            <button
                                onClick={handleBack}
                                disabled={isLoading}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    opacity: isLoading ? 0.5 : 1,
                                }}
                            >
                                <ChevronLeft size={20} color={isDarkMode ? '#fff' : '#1a1a2e'} />
                            </button>
                        )}
                        <h2 className={styles.modalTitle}>
                            {step === 'input' ? 'Create Brand' : 'Verify Brand Playbook'}
                        </h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Step indicators */}
                        <div style={{ display: 'flex', gap: '6px', marginRight: '12px' }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: step === 'input' ? '#7c4dff' : 'rgba(124, 77, 255, 0.3)',
                            }} />
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: step === 'verify' ? '#7c4dff' : 'rgba(124, 77, 255, 0.3)',
                            }} />
                        </div>
                        <button
                            className={styles.modalCloseBtn}
                            onClick={() => { resetForm(); onClose(); }}
                            disabled={isLoading}
                            type="button"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className={styles.modalError} style={{ margin: '0 24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* STEP 1: Input Form */}
                {step === 'input' && (
                    <div className={styles.modalForm}>
                        {/* Brand Name */}
                        <div className={styles.modalField}>
                            <label className={styles.modalLabel}>
                                Brand Name <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                className={styles.modalInput}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter brand name"
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>

                        {/* Industry */}
                        <div className={styles.modalField}>
                            <label className={styles.modalLabel}>
                                Industry <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                className={styles.modalInput}
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                placeholder="e.g. Fitness / Home Wellness"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Website URL & Currency Row */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {/* Website URL */}
                            <div className={styles.modalField} style={{ flex: 1 }}>
                                <label className={styles.modalLabel}>
                                    Website URL <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="url"
                                    className={styles.modalInput}
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://example.com"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Currency */}
                            <div className={styles.modalField} style={{ width: '110px', flexShrink: 0 }}>
                                <label className={styles.modalLabel}>
                                    Currency
                                </label>
                                <select
                                    className={styles.modalInput}
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    disabled={isLoading}
                                    style={{
                                        cursor: 'pointer',
                                        appearance: 'auto',
                                    }}
                                >
                                    <option value="GBP">GBP</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>
                        </div>

                        {/* Playbook Source Tabs */}
                        <div className={styles.modalField}>
                            <label className={styles.modalLabel}>
                                Brand Playbook <span className={styles.required}>*</span>
                            </label>

                            {/* Tab buttons */}
                            <div style={{
                                display: 'flex',
                                gap: '0',
                                marginBottom: '12px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: `1px solid ${isDarkMode ? 'rgba(124, 77, 255, 0.3)' : 'rgba(124, 77, 255, 0.2)'}`,
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setInputTab('file')}
                                    disabled={isLoading}
                                    style={{
                                        flex: 1,
                                        padding: '10px 16px',
                                        border: 'none',
                                        background: inputTab === 'file'
                                            ? 'linear-gradient(135deg, #7c4dff 0%, #9575cd 100%)'
                                            : 'transparent',
                                        color: inputTab === 'file' ? '#fff' : (isDarkMode ? '#aaa' : '#666'),
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <Upload size={14} />
                                    File Upload
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInputTab('text')}
                                    disabled={isLoading}
                                    style={{
                                        flex: 1,
                                        padding: '10px 16px',
                                        border: 'none',
                                        background: inputTab === 'text'
                                            ? 'linear-gradient(135deg, #7c4dff 0%, #9575cd 100%)'
                                            : 'transparent',
                                        color: inputTab === 'text' ? '#fff' : (isDarkMode ? '#aaa' : '#666'),
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <FileText size={14} />
                                    Manual Entry
                                </button>
                            </div>

                            {/* File Upload Zone */}
                            {inputTab === 'file' && (
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        border: `2px dashed ${file ? '#7c4dff' : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)')}`,
                                        borderRadius: '12px',
                                        padding: '32px 24px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: file
                                            ? 'rgba(124, 77, 255, 0.1)'
                                            : (isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.docx,.txt"
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                    {file ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <Check size={32} color="#7c4dff" />
                                            <span style={{ color: isDarkMode ? '#fff' : '#1a1a2e', fontWeight: 500 }}>
                                                {file.name}
                                            </span>
                                            <span style={{ color: isDarkMode ? '#888' : '#666', fontSize: '12px' }}>
                                                {(file.size / 1024).toFixed(1)} KB
                                            </span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <Upload size={32} color={isDarkMode ? '#666' : '#999'} />
                                            <span style={{ color: isDarkMode ? '#aaa' : '#666' }}>
                                                Drag & drop or click to upload
                                            </span>
                                            <span style={{ color: isDarkMode ? '#666' : '#999', fontSize: '12px' }}>
                                                PDF, DOCX, or TXT (max 10MB)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Text Input */}
                            {inputTab === 'text' && (
                                <textarea
                                    className={styles.modalTextarea}
                                    value={textContent}
                                    onChange={(e) => setTextContent(e.target.value)}
                                    placeholder="Describe your brand identity...&#10;&#10;For example:&#10;- Our brand colors are #FF6B6B (coral) and #4ECDC4 (teal)&#10;- Primary font: Montserrat for headlines&#10;- Body font: Open Sans&#10;- Tone: friendly, professional, modern&#10;- Target audience: young professionals 25-35"
                                    disabled={isLoading}
                                    rows={8}
                                    style={{ resize: 'vertical', minHeight: '160px' }}
                                />
                            )}
                        </div>

                        {/* Actions */}
                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                className={styles.modalCancelBtn}
                                onClick={() => { resetForm(); onClose(); }}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={styles.modalSubmitBtn}
                                onClick={handleAnalyze}
                                disabled={isLoading || !canAnalyze}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={16} className={styles.spinner} />
                                        Analyzing...
                                    </>
                                ) : (
                                    'Analyze & Create'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: JSON Verification */}
                {step === 'verify' && (
                    <div className={styles.modalForm}>
                        <p style={{
                            color: isDarkMode ? '#aaa' : '#666',
                            fontSize: '13px',
                            marginBottom: '16px',
                            lineHeight: 1.5,
                        }}>
                            Review and edit the extracted brand playbook. Fix any AI hallucinations before saving.
                        </p>

                        {/* JSON Editor */}
                        <div className={styles.modalField}>
                            <label className={styles.modalLabel}>
                                Brand Playbook JSON
                            </label>
                            <div style={{ position: 'relative' }}>
                                <textarea
                                    value={playbookJson}
                                    onChange={(e) => {
                                        setPlaybookJson(e.target.value);
                                        validateJson(e.target.value);
                                    }}
                                    disabled={isLoading}
                                    style={{
                                        width: '100%',
                                        minHeight: '350px',
                                        padding: '16px',
                                        fontFamily: 'Monaco, Menlo, monospace',
                                        fontSize: '12px',
                                        lineHeight: 1.6,
                                        border: jsonError
                                            ? '2px solid #ff5252'
                                            : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
                                        borderRadius: '8px',
                                        background: isDarkMode ? '#1a1a2e' : '#f8f9fa',
                                        color: isDarkMode ? '#e8e8e8' : '#1a1a2e',
                                        resize: 'vertical',
                                        outline: 'none',
                                    }}
                                />
                                {jsonError && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '8px',
                                        right: '8px',
                                        background: '#ff5252',
                                        color: '#fff',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: 500,
                                    }}>
                                        {jsonError}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                className={styles.modalCancelBtn}
                                onClick={handleBack}
                                disabled={isLoading}
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                className={styles.modalSubmitBtn}
                                onClick={handleSave}
                                disabled={isLoading || !!jsonError}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={16} className={styles.spinner} />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        Save Brand
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateBrandModal;
