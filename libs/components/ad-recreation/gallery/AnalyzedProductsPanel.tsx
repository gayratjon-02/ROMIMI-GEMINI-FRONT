// libs/components/ad-recreation/gallery/AnalyzedProductsPanel.tsx
// Full management panel for analyzed products shown in the main content area
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Trash2, CheckSquare, Square, Loader2 } from 'lucide-react';
import { getAdProducts, deleteAdProduct, AdProductListItem } from '@/libs/server/Ad-Recreation/products/ad-product.service';

interface AnalyzedProductsPanelProps {
    isDarkMode: boolean;
    selectedProductId: string | null;
    onSelect: (productId: string, imageUrl: string, analysis: Record<string, any>) => void;
    onDeleted: (deletedIds: string[]) => void;
    onClose: () => void;
}

const AnalyzedProductsPanel: React.FC<AnalyzedProductsPanelProps> = ({
    isDarkMode,
    selectedProductId,
    onSelect,
    onDeleted,
    onClose,
}) => {
    const [products, setProducts] = useState<AdProductListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deleteMode, setDeleteMode] = useState<'selected' | 'all' | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        getAdProducts()
            .then(data => setProducts(data.filter(p => p.analyzed_product_json)))
            .catch(err => console.error('Failed to fetch products:', err))
            .finally(() => setIsLoading(false));
    }, []);

    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === products.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(products.map(p => p.id)));
        }
    };

    const handleUseProduct = (product: AdProductListItem) => {
        if (!product.analyzed_product_json) return;
        onSelect(product.id, product.front_image_url || '', product.analyzed_product_json);
        onClose();
    };

    const handleDeleteConfirm = async () => {
        if (!deleteMode) return;
        setIsDeleting(true);
        const idsToDelete = deleteMode === 'all'
            ? products.map(p => p.id)
            : Array.from(selectedIds);

        try {
            await Promise.allSettled(idsToDelete.map(id => deleteAdProduct(id)));
            setProducts(prev => prev.filter(p => !idsToDelete.includes(p.id)));
            setSelectedIds(new Set());
            onDeleted(idsToDelete);
        } catch (err) {
            console.error('Failed to delete products:', err);
        } finally {
            setIsDeleting(false);
            setDeleteMode(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const textColor = isDarkMode ? '#fff' : '#1a1a2e';
    const mutedColor = isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    const cardBg = isDarkMode ? 'rgba(255,255,255,0.04)' : '#fff';
    const cardBorder = '1px solid rgba(124, 77, 255, 0.15)';
    const selectedBorder = '2px solid #7c4dff';

    return (
        <div style={{ padding: '0', minHeight: '100%' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '12px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                            border: '1px solid rgba(124, 77, 255, 0.2)',
                            borderRadius: '8px',
                            color: textColor,
                            cursor: 'pointer',
                            fontSize: '13px',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'; }}
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: textColor, margin: 0 }}>
                            Analyzed Products
                        </h2>
                        <p style={{ fontSize: '13px', color: mutedColor, margin: '2px 0 0' }}>
                            {products.length} products{selectedIds.size > 0 ? ` / ${selectedIds.size} selected` : ''}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Select All */}
                    {products.length > 0 && (
                        <button
                            type="button"
                            onClick={toggleSelectAll}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                background: 'transparent',
                                border: '1px solid rgba(124, 77, 255, 0.3)',
                                borderRadius: '8px',
                                color: textColor,
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 500,
                            }}
                        >
                            {selectedIds.size === products.length && products.length > 0
                                ? <CheckSquare size={14} color="#7c4dff" />
                                : <Square size={14} />
                            }
                            Select All
                        </button>
                    )}

                    {/* Delete Selected */}
                    {selectedIds.size > 0 && (
                        <button
                            type="button"
                            onClick={() => setDeleteMode('selected')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                background: 'rgba(255, 68, 68, 0.1)',
                                border: '1px solid rgba(255, 68, 68, 0.3)',
                                borderRadius: '8px',
                                color: '#ff4444',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                            }}
                        >
                            <Trash2 size={14} />
                            Delete Selected ({selectedIds.size})
                        </button>
                    )}

                    {/* Delete All */}
                    {products.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setDeleteMode('all')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                background: 'rgba(255, 68, 68, 0.06)',
                                border: '1px solid rgba(255, 68, 68, 0.2)',
                                borderRadius: '8px',
                                color: '#ff6666',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 500,
                            }}
                        >
                            <Trash2 size={14} />
                            Delete All
                        </button>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '60px 0',
                    color: mutedColor,
                    fontSize: '14px',
                }}>
                    <Loader2 size={20} style={{ animation: 'spin 0.9s linear infinite' }} />
                    Loading products...
                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && products.length === 0 && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '60px 0',
                    color: mutedColor,
                    textAlign: 'center',
                }}>
                    <Package size={40} style={{ opacity: 0.3 }} />
                    <div style={{ fontSize: '16px', fontWeight: 500 }}>No analyzed products yet</div>
                    <div style={{ fontSize: '13px', opacity: 0.7 }}>Upload a product image to get started</div>
                </div>
            )}

            {/* Product Grid */}
            {!isLoading && products.length > 0 && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    alignItems: 'flex-start',
                }}>
                    {products.map(product => {
                        const isChecked = selectedIds.has(product.id);
                        const isActiveProduct = product.id === selectedProductId;

                        return (
                            <div
                                key={product.id}
                                style={{
                                    width: '160px',
                                    background: cardBg,
                                    borderRadius: '10px',
                                    overflow: 'hidden',
                                    border: isChecked ? selectedBorder : (isActiveProduct ? '2px solid rgba(124, 77, 255, 0.5)' : cardBorder),
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    boxShadow: isDarkMode ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(124, 77, 255, 0.15)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = isDarkMode ? 'none' : '0 1px 4px rgba(0,0,0,0.06)';
                                }}
                            >
                                {/* Thumbnail */}
                                <div
                                    onClick={() => handleUseProduct(product)}
                                    style={{
                                        width: '100%',
                                        aspectRatio: '1/1',
                                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f5f5f5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        position: 'relative',
                                    }}
                                >
                                    {product.front_image_url ? (
                                        <img
                                            src={product.front_image_url}
                                            alt={product.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <Package size={32} style={{ opacity: 0.2 }} />
                                    )}

                                    {/* Active badge */}
                                    {isActiveProduct && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '6px',
                                            right: '6px',
                                            padding: '2px 8px',
                                            background: '#7c4dff',
                                            borderRadius: '10px',
                                            fontSize: '9px',
                                            fontWeight: 700,
                                            color: '#fff',
                                            letterSpacing: '0.5px',
                                        }}>
                                            ACTIVE
                                        </div>
                                    )}
                                </div>

                                {/* Checkbox overlay */}
                                <div
                                    onClick={(e) => toggleSelect(product.id, e)}
                                    style={{
                                        position: 'absolute',
                                        top: '6px',
                                        left: '6px',
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '5px',
                                        background: isChecked ? '#7c4dff' : (isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)'),
                                        border: isChecked ? '2px solid #7c4dff' : '2px solid rgba(124, 77, 255, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        backdropFilter: 'blur(4px)',
                                    }}
                                >
                                    {isChecked && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>

                                {/* Footer */}
                                <div
                                    onClick={() => handleUseProduct(product)}
                                    style={{ padding: '10px 10px 10px' }}
                                >
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: textColor,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {product.name}
                                    </div>
                                    <div style={{ fontSize: '10px', color: mutedColor, marginTop: '3px' }}>
                                        {formatDate(product.created_at)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteMode && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    onClick={() => !isDeleting && setDeleteMode(null)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: isDarkMode ? '#1a1a2e' : '#ffffff',
                            borderRadius: '12px',
                            padding: '24px',
                            maxWidth: '400px',
                            width: '90%',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            border: '1px solid rgba(124, 77, 255, 0.3)',
                        }}
                    >
                        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: textColor }}>
                            {deleteMode === 'all'
                                ? `Delete All ${products.length} Products?`
                                : `Delete ${selectedIds.size} Product${selectedIds.size > 1 ? 's' : ''}?`
                            }
                        </div>
                        <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '20px', color: textColor }}>
                            This action is permanent and cannot be undone. All selected products and their analyses will be removed from the database.
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setDeleteMode(null)}
                                disabled={isDeleting}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(124, 77, 255, 0.3)',
                                    background: 'transparent',
                                    color: textColor,
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: '#ff4444',
                                    color: '#fff',
                                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    opacity: isDeleting ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 size={14} style={{ animation: 'spin 0.9s linear infinite' }} />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyzedProductsPanel;
