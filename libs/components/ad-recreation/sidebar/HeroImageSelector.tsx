// libs/components/ad-recreation/sidebar/HeroImageSelector.tsx
// Hero Image Selection — User maps a specific product image to the concept's hero zone

import React from 'react';
import { ImageIcon, CheckCircle } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface ProductImageOption {
    url: string;
    label: string; // e.g., "Front", "Back", "Solo 1", "Flatlay 2"
}

interface HeroImageSelectorProps {
    productImages: ProductImageOption[];
    selectedHeroImage: string | null;
    onSelect: (imageUrl: string) => void;
    heroZoneId: string;
    heroZoneLabel?: string;
    isDarkMode: boolean;
}

// ============================================
// HELPER: Detect hero zone from concept JSON
// ============================================

/**
 * Finds the primary image/hero zone from a concept's analysis JSON.
 * Looks for zones with content_type containing "image", "hero", or "product".
 * Returns { id, label } or null if no hero zone exists.
 */
export function detectHeroZone(analysisJson: any): { id: string; label: string } | null {
    if (!analysisJson?.layout?.zones || !Array.isArray(analysisJson.layout.zones)) {
        return null;
    }

    const heroKeywords = ['product_hero', 'hero_image', 'hero', 'athlete_product', 'product'];
    const imageKeywords = ['image', 'photo', 'visual', 'product_shot'];

    // First pass: look for explicit hero zones
    for (const zone of analysisJson.layout.zones) {
        const ct = (zone.content_type || '').toLowerCase();
        for (const kw of heroKeywords) {
            if (ct.includes(kw)) {
                return {
                    id: zone.id || zone.content_type,
                    label: zone.content_type?.replace(/_/g, ' ') || 'Hero Image',
                };
            }
        }
    }

    // Second pass: look for any image-type zone
    for (const zone of analysisJson.layout.zones) {
        const ct = (zone.content_type || '').toLowerCase();
        for (const kw of imageKeywords) {
            if (ct.includes(kw)) {
                return {
                    id: zone.id || zone.content_type,
                    label: zone.content_type?.replace(/_/g, ' ') || 'Image Zone',
                };
            }
        }
    }

    return null;
}

/**
 * Collects available product images from the product context.
 * Returns front, back, reference, and generated images as selectable options.
 */
export function collectProductImages(
    frontImageUrl?: string | null,
    backImageUrl?: string | null,
    referenceImages?: string[] | null,
    fullAnalysisResponse?: any,
): ProductImageOption[] {
    const images: ProductImageOption[] = [];

    if (frontImageUrl) {
        images.push({ url: frontImageUrl, label: 'Front' });
    }
    if (backImageUrl) {
        images.push({ url: backImageUrl, label: 'Back' });
    }
    if (referenceImages && Array.isArray(referenceImages)) {
        referenceImages.forEach((url, i) => {
            if (url && url.trim()) {
                images.push({ url, label: `Reference ${i + 1}` });
            }
        });
    }

    // Include generated images from Phase 1 (solo, flatlay, etc.) if available
    if (fullAnalysisResponse?.reference_images && Array.isArray(fullAnalysisResponse.reference_images)) {
        fullAnalysisResponse.reference_images.forEach((url: string, i: number) => {
            if (url && url.trim() && !images.some(img => img.url === url)) {
                images.push({ url, label: `Generated ${i + 1}` });
            }
        });
    }

    return images;
}

// ============================================
// COMPONENT
// ============================================

const HeroImageSelector: React.FC<HeroImageSelectorProps> = ({
    productImages,
    selectedHeroImage,
    onSelect,
    heroZoneId,
    heroZoneLabel,
    isDarkMode,
}) => {
    if (productImages.length === 0) {
        return (
            <div style={{
                padding: '12px',
                marginBottom: '12px',
                borderRadius: '10px',
                background: isDarkMode ? 'rgba(255,152,0,0.08)' : 'rgba(255,152,0,0.06)',
                border: '1px solid rgba(255,152,0,0.25)',
                fontSize: '12px',
                color: isDarkMode ? '#ffb74d' : '#e65100',
            }}>
                ⚠️ No product images available. Upload or select a product first.
            </div>
        );
    }

    return (
        <div style={{ marginBottom: '16px' }}>
            {/* Section Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
            }}>
                <ImageIcon size={14} style={{ color: '#7c4dff' }} />
                <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: isDarkMode ? '#e0e0e0' : '#333',
                }}>
                    Select Hero Image
                </span>
            </div>

            {/* Zone Info Badge */}
            <div style={{
                padding: '6px 10px',
                marginBottom: '10px',
                borderRadius: '6px',
                background: isDarkMode ? 'rgba(124,77,255,0.08)' : 'rgba(124,77,255,0.06)',
                border: '1px solid rgba(124,77,255,0.2)',
                fontSize: '11px',
                color: isDarkMode ? '#b39ddb' : '#5e35b1',
            }}>
                🎯 Zone: <strong>{heroZoneLabel || heroZoneId}</strong> — Pick the product image to place here
            </div>

            {/* Image Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
            }}>
                {productImages.map((img) => {
                    const isSelected = selectedHeroImage === img.url;

                    return (
                        <div
                            key={img.url}
                            onClick={() => onSelect(img.url)}
                            style={{
                                position: 'relative',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                border: isSelected
                                    ? '2px solid #7c4dff'
                                    : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                transition: 'all 0.2s ease',
                                boxShadow: isSelected ? '0 0 12px rgba(124,77,255,0.3)' : 'none',
                                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                            }}
                        >
                            {/* Image */}
                            <div style={{
                                width: '100%',
                                aspectRatio: '1',
                                overflow: 'hidden',
                                background: isDarkMode ? '#1a1a2e' : '#f5f5f5',
                            }}>
                                <img
                                    src={img.url}
                                    alt={img.label}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        opacity: isSelected ? 1 : 0.8,
                                        transition: 'opacity 0.2s ease',
                                    }}
                                />
                            </div>

                            {/* Label */}
                            <div style={{
                                padding: '4px 6px',
                                fontSize: '10px',
                                fontWeight: 500,
                                textAlign: 'center',
                                background: isDarkMode
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'rgba(0,0,0,0.03)',
                                color: isDarkMode ? '#ccc' : '#555',
                            }}>
                                {img.label}
                            </div>

                            {/* Selection Check Badge */}
                            {isSelected && (
                                <div style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    background: '#7c4dff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 6px rgba(124,77,255,0.4)',
                                }}>
                                    <CheckCircle size={14} color="#fff" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Selected Confirmation */}
            {selectedHeroImage && (
                <div style={{
                    marginTop: '8px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: isDarkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.06)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    fontSize: '11px',
                    color: isDarkMode ? '#86efac' : '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                }}>
                    <CheckCircle size={12} />
                    Linked to Hero Zone
                </div>
            )}
        </div>
    );
};

export default HeroImageSelector;
