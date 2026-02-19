'use client';

import React, { useRef, useState } from 'react';
import { Upload, CheckCircle, Loader2, X } from 'lucide-react';
import { analyzeAdProduct } from '@/libs/server/Ad-Recreation/products/ad-product.service';

interface AdProductUploadSectionProps {
    isDarkMode?: boolean;
    onAnalyzed: (productId: string, imageUrl: string, analysis: Record<string, any>) => void;
    productId?: string | null;
    imageUrl?: string | null;
    onReset?: () => void;
}

const AdProductUploadSection: React.FC<AdProductUploadSectionProps> = ({
    isDarkMode = true,
    onAnalyzed,
    productId,
    imageUrl,
    onReset,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl || null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const textColor = isDarkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)';
    const mutedColor = isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    const borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const bg = isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
    const activeBorder = '#7c4dff';

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Only image files are allowed');
            return;
        }

        setError(null);
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);
        setIsAnalyzing(true);

        try {
            const result = await analyzeAdProduct(file);
            onAnalyzed(result.product_id, result.image_url, result.analysis);
        } catch (err: any) {
            console.error('Ad product analysis failed:', err);
            setError(err?.response?.data?.message || err?.message || 'Analysis failed');
            setPreviewUrl(null);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const handleReset = () => {
        setPreviewUrl(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onReset?.();
    };

    // After analysis: show image + success state
    if (productId && (previewUrl || imageUrl)) {
        return (
            <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px', display: 'block' }}>
                    Product
                </label>
                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `1.5px solid rgba(124, 77, 255, 0.5)`, background: bg }}>
                    <img
                        src={previewUrl || imageUrl || ''}
                        alt="Reference product"
                        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                    />
                    {/* Success badge */}
                    <div style={{
                        position: 'absolute', bottom: 8, left: 8,
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'rgba(16,185,129,0.85)', backdropFilter: 'blur(4px)',
                        borderRadius: 6, padding: '3px 8px',
                        color: '#fff', fontSize: 11, fontWeight: 600,
                    }}>
                        <CheckCircle size={11} />
                        <span>Analyzed</span>
                    </div>
                    {/* Reset button */}
                    <button
                        onClick={handleReset}
                        title="Remove product"
                        style={{
                            position: 'absolute', top: 6, right: 6,
                            width: 24, height: 24, borderRadius: 6,
                            border: 'none', background: 'rgba(0,0,0,0.55)',
                            color: '#fff', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <X size={13} />
                    </button>
                </div>
            </div>
        );
    }

    // Upload / analyzing state
    return (
        <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px', display: 'block' }}>
                Product
            </label>

            <div
                onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                style={{
                    border: `1.5px dashed ${isDragging ? activeBorder : isAnalyzing ? 'rgba(124,77,255,0.6)' : borderColor}`,
                    borderRadius: '10px',
                    background: isDragging ? 'rgba(124,77,255,0.07)' : bg,
                    padding: previewUrl ? '0' : '20px 12px',
                    cursor: isAnalyzing ? 'default' : 'pointer',
                    transition: 'all 0.18s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    minHeight: '100px',
                    position: 'relative',
                    overflow: previewUrl ? 'hidden' : 'visible',
                }}
            >
                {previewUrl && isAnalyzing ? (
                    <>
                        <img src={previewUrl} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', opacity: 0.45 }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(0,0,0,0.35)' }}>
                            <Loader2 size={22} color="#7c4dff" style={{ animation: 'spin 0.9s linear infinite' }} />
                            <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>Analyzing...</span>
                        </div>
                    </>
                ) : (
                    <>
                        <Upload size={20} color={activeBorder} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: textColor }}>Upload product image</div>
                            <div style={{ fontSize: '11px', color: mutedColor, marginTop: 2 }}>one reference image to replicate</div>
                        </div>
                    </>
                )}
            </div>

            {error && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#ef4444', paddingLeft: 2 }}>{error}</div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleInputChange}
            />

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default AdProductUploadSection;
