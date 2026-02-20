// libs/components/ad-recreation/sidebar/AnalyzedProductSelector.tsx
// Dropdown list of previously analyzed products, similar to AngleSelector pattern
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Loader2, Package } from 'lucide-react';
import { getAdProducts, AdProductListItem } from '@/libs/server/Ad-Recreation/products/ad-product.service';

const AUTO_CLOSE_DELAY = 3000;

interface AnalyzedProductSelectorProps {
    isDarkMode: boolean;
    selectedProductId: string | null;
    onSelect: (productId: string, imageUrl: string, analysis: Record<string, any>) => void;
}

const AnalyzedProductSelector: React.FC<AnalyzedProductSelectorProps> = ({
    isDarkMode,
    selectedProductId,
    onSelect,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [products, setProducts] = useState<AdProductListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
    const hasFetchedRef = useRef(false);

    const selectedProduct = products.find(p => p.id === selectedProductId) || null;

    const clearCloseTimer = useCallback(() => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (!isExpanded) return;
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => {
            setIsExpanded(false);
        }, AUTO_CLOSE_DELAY);
    }, [isExpanded, clearCloseTimer]);

    const handleMouseEnter = useCallback(() => {
        clearCloseTimer();
    }, [clearCloseTimer]);

    // Click outside → close
    useEffect(() => {
        if (!isExpanded) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                clearCloseTimer();
                setIsExpanded(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded, clearCloseTimer]);

    useEffect(() => {
        return () => clearCloseTimer();
    }, [clearCloseTimer]);

    // Fetch products when dropdown opens (once)
    useEffect(() => {
        if (!isExpanded || hasFetchedRef.current) return;
        hasFetchedRef.current = true;
        setIsLoading(true);
        getAdProducts()
            .then(data => setProducts(data.filter(p => p.analyzed_product_json)))
            .catch(err => console.error('Failed to fetch analyzed products:', err))
            .finally(() => setIsLoading(false));
    }, [isExpanded]);

    // Refresh list when dropdown reopens (to pick up newly analyzed products)
    const handleToggle = () => {
        if (!isExpanded) {
            // Always re-fetch on open to pick up newly uploaded products
            setIsLoading(true);
            getAdProducts()
                .then(data => setProducts(data.filter(p => p.analyzed_product_json)))
                .catch(err => console.error('Failed to fetch analyzed products:', err))
                .finally(() => setIsLoading(false));
        }
        setIsExpanded(prev => !prev);
    };

    const handleSelect = (product: AdProductListItem) => {
        if (!product.analyzed_product_json) return;
        onSelect(
            product.id,
            product.front_image_url || '',
            product.analyzed_product_json,
        );
        clearCloseTimer();
        setIsExpanded(false);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const getHeaderLabel = () => {
        if (selectedProduct) return selectedProduct.name;
        return 'None selected';
    };

    return (
        <div
            ref={containerRef}
            style={{ position: 'relative', marginBottom: '0' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Section Label */}
            <label
                style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    marginBottom: '6px',
                    display: 'block',
                }}
            >
                Analyzed Products
            </label>

            {/* Dropdown Header */}
            <div
                onClick={handleToggle}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    padding: '12px 16px',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    border: '1px solid rgba(124, 77, 255, 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: isDarkMode ? '#fff' : '#1a1a2e',
                    fontSize: '14px',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    <strong>{products.length}</strong> analyzed: {getHeaderLabel()}
                </span>
                {isExpanded ? <ChevronUp size={18} style={{ flexShrink: 0 }} /> : <ChevronDown size={18} style={{ flexShrink: 0 }} />}
            </div>

            {/* Dropdown Content */}
            {isExpanded && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        background: isDarkMode ? '#1a1a2e' : '#ffffff',
                        border: '1px solid rgba(124, 77, 255, 0.3)',
                        boxShadow: isDarkMode
                            ? '0 8px 32px rgba(0,0,0,0.5)'
                            : '0 8px 32px rgba(124, 77, 255, 0.15)',
                        borderRadius: '8px',
                        maxHeight: '55vh',
                        overflowY: 'auto',
                    }}
                >
                    {isLoading ? (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '24px',
                                color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                                fontSize: '13px',
                            }}
                        >
                            <Loader2 size={16} style={{ animation: 'spin 0.9s linear infinite' }} />
                            Loading products...
                            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : products.length === 0 ? (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '24px',
                                color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                fontSize: '13px',
                                textAlign: 'center',
                            }}
                        >
                            <Package size={24} opacity={0.4} />
                            No analyzed products yet.
                            <span style={{ fontSize: '11px' }}>Upload a product above to analyze it.</span>
                        </div>
                    ) : (
                        <>
                            {/* Category-style header */}
                            <div
                                style={{
                                    padding: '8px 12px',
                                    background: isDarkMode
                                        ? 'rgba(124, 77, 255, 0.15)'
                                        : 'rgba(124, 77, 255, 0.1)',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    color: '#7c4dff',
                                    borderBottom: '1px solid rgba(124, 77, 255, 0.2)',
                                }}
                            >
                                Previously Analyzed ({products.length})
                            </div>

                            {products.map(product => {
                                const isSelected = product.id === selectedProductId;
                                const thumbUrl = product.front_image_url;

                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => handleSelect(product)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            width: '100%',
                                            padding: '10px 12px',
                                            background: isSelected
                                                ? 'rgba(124, 77, 255, 0.15)'
                                                : 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: isDarkMode ? '#fff' : '#1a1a2e',
                                            textAlign: 'left',
                                            transition: 'background 0.15s',
                                            borderBottom: '1px solid rgba(124, 77, 255, 0.06)',
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSelected) {
                                                (e.currentTarget as HTMLButtonElement).style.background =
                                                    'rgba(124, 77, 255, 0.08)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected) {
                                                (e.currentTarget as HTMLButtonElement).style.background =
                                                    'transparent';
                                            }
                                        }}
                                    >
                                        {/* Thumbnail */}
                                        <div
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '6px',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                                border: isSelected
                                                    ? '2px solid #7c4dff'
                                                    : '1px solid rgba(124, 77, 255, 0.2)',
                                                background: isDarkMode
                                                    ? 'rgba(255,255,255,0.05)'
                                                    : 'rgba(0,0,0,0.05)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {thumbUrl ? (
                                                <img
                                                    src={thumbUrl}
                                                    alt={product.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            ) : (
                                                <Package size={16} opacity={0.4} />
                                            )}
                                        </div>

                                        {/* Name & date */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: 500,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {product.name}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '11px',
                                                    opacity: 0.5,
                                                    marginTop: '2px',
                                                }}
                                            >
                                                {formatDate(product.created_at)}
                                            </div>
                                        </div>

                                        {/* Selected checkmark */}
                                        {isSelected && (
                                            <CheckCircle size={16} color="#7c4dff" style={{ flexShrink: 0 }} />
                                        )}
                                    </button>
                                );
                            })}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalyzedProductSelector;
