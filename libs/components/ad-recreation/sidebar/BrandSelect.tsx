// libs/components/ad-recreation/sidebar/BrandSelect.tsx
import React, { useState, useEffect } from 'react';
import { ChevronDown, Loader2, Plus, Trash2 } from 'lucide-react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';
import { fetchAdBrands, deleteAdBrand, AdBrand } from '@/libs/server/Ad-Recreation/brand/brand.service';
import CreateBrandModal from './CreateBrandModal';

// Local Brand interface for component display (includes logo emoji fallback)
export interface Brand {
    id: string;
    name: string;
    logo: string;
    logo_url?: string;
}

interface BrandSelectProps {
    brands?: Brand[]; // Optional override with mock data
    selectedBrandId: string | null;
    onSelect: (brandId: string) => void;
    isDarkMode: boolean;
}

// Emoji fallback based on brand name
const getBrandEmoji = (name: string): string => {
    const nameLC = name.toLowerCase();
    if (nameLC.includes('nike')) return '🏃';
    if (nameLC.includes('adidas')) return '⚽';
    if (nameLC.includes('puma')) return '🐆';
    if (nameLC.includes('apple')) return '🍎';
    if (nameLC.includes('google')) return '🔍';
    if (nameLC.includes('amazon')) return '📦';
    return '🏷️'; // Default brand icon
};

/**
 * Normalizes logo URLs from the backend.
 * Backend stores URLs like http://localhost:4001/uploads/... which won't work
 * on deployed environments or different ports. This extracts the path and
 * makes it relative so Next.js can proxy it through the API rewrites.
 */
const fixLogoUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    // If URL contains localhost, extract just the path portion
    // e.g., "http://localhost:4001/uploads/ad-brands/assets/abc.png" -> "/uploads/ad-brands/assets/abc.png"
    try {
        const parsed = new URL(url);
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
            // Use the backend API base URL instead (proxied via Next.js rewrites)
            const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
            return `${backendBase}${parsed.pathname}`;
        }
        return url;
    } catch {
        // Not a valid URL, return as-is
        return url;
    }
};

// Transform API brand to display brand
const transformBrand = (apiBrand: AdBrand): Brand => ({
    id: apiBrand.id,
    name: apiBrand.name,
    logo: getBrandEmoji(apiBrand.name),
    logo_url: fixLogoUrl(apiBrand.assets?.logo_light || apiBrand.assets?.logo_dark),
});

const BrandSelect: React.FC<BrandSelectProps> = ({
    brands: propBrands,
    selectedBrandId,
    onSelect,
    isDarkMode,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [apiBrands, setApiBrands] = useState<Brand[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imgErrors, setImgErrors] = useState<Set<string>>(new Set()); // Track broken logos
    const [deleteConfirmBrand, setDeleteConfirmBrand] = useState<Brand | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Use prop brands if provided, otherwise fetch from API
    const brands = propBrands || apiBrands;

    // Fetch brands from API on mount (if no prop brands provided)
    useEffect(() => {
        if (propBrands) return; // Skip if using mock data

        const loadBrands = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchedBrands = await fetchAdBrands();
                const transformedBrands = fetchedBrands.map(transformBrand);
                setApiBrands(transformedBrands);

                // Auto-select first brand if none selected
                if (!selectedBrandId && transformedBrands.length > 0) {
                    onSelect(transformedBrands[0].id);
                }
            } catch (err) {
                console.error('Failed to load brands:', err);
                setError('Failed to load brands');
            } finally {
                setIsLoading(false);
            }
        };

        loadBrands();
    }, [propBrands, selectedBrandId, onSelect]);

    const handleSelect = (brandId: string) => {
        onSelect(brandId);
        setIsOpen(false);
    };

    const handleOpenCreateModal = () => {
        setIsOpen(false);
        setIsModalOpen(true);
    };

    const handleBrandCreated = (newBrand: AdBrand) => {
        // Transform and add new brand to list
        const transformedBrand = transformBrand(newBrand);
        setApiBrands(prev => [...prev, transformedBrand]);

        // Auto-select the new brand
        onSelect(newBrand.id);
    };

    const handleDeleteClick = (brand: Brand, e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
        setDeleteConfirmBrand(brand);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirmBrand) return;
        setIsDeleting(true);
        try {
            await deleteAdBrand(deleteConfirmBrand.id);
            const remaining = apiBrands.filter(b => b.id !== deleteConfirmBrand.id);
            setApiBrands(remaining);

            // If deleted brand was selected, auto-select next one
            if (selectedBrandId === deleteConfirmBrand.id) {
                onSelect(remaining.length > 0 ? remaining[0].id : '');
            }

            setDeleteConfirmBrand(null);
        } catch (err) {
            console.error('Failed to delete brand:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    // Find selected brand object
    const selectedBrand = brands.find(b => b.id === selectedBrandId);

    return (
        <>
            <div className={styles.section}>
                <label className={styles.sectionLabel}>Brand</label>
                <div className={styles.brandSelector}>
                    <button
                        className={styles.brandDropdown}
                        onClick={() => setIsOpen(!isOpen)}
                        type="button"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className={styles.brandInfo}>
                                <Loader2 size={18} className={styles.spinner} />
                                <span>Loading brands...</span>
                            </div>
                        ) : selectedBrand ? (
                            <div className={styles.brandInfo}>
                                {selectedBrand.logo_url && !imgErrors.has(selectedBrand.id) ? (
                                    <img
                                        src={selectedBrand.logo_url}
                                        alt={selectedBrand.name}
                                        style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 4 }}
                                        onError={() => setImgErrors(prev => new Set(prev).add(selectedBrand.id))}
                                    />
                                ) : (
                                    <span className={styles.brandLogo}>{selectedBrand.logo}</span>
                                )}
                                <span className={styles.brandName}>{selectedBrand.name}</span>
                            </div>
                        ) : (
                            <div className={styles.brandInfo}>
                                <span className={styles.brandLogo}>🏷️</span>
                                <span className={styles.brandName}>Select a brand</span>
                            </div>
                        )}
                        <ChevronDown
                            className={`${styles.dropdownIcon} ${isOpen ? styles.open : ''}`}
                            size={16}
                        />
                    </button>

                    {isOpen && !isLoading && (
                        <div className={styles.brandMenu}>
                            {error ? (
                                <div className={styles.brandOption} style={{ color: '#ef4444' }}>
                                    {error}
                                </div>
                            ) : brands.length === 0 ? (
                                <div className={styles.brandOption} style={{ opacity: 0.5 }}>
                                    No brands available
                                </div>
                            ) : (
                                brands.map(brand => (
                                    <div
                                        key={brand.id}
                                        className={`${styles.brandOption} ${selectedBrandId === brand.id ? styles.selected : ''}`}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                    >
                                        <button
                                            className={styles.brandOptionContent}
                                            onClick={() => handleSelect(brand.id)}
                                            type="button"
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                                        >
                                            {brand.logo_url && !imgErrors.has(brand.id) ? (
                                                <img
                                                    src={brand.logo_url}
                                                    alt={brand.name}
                                                    style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 3 }}
                                                    onError={() => setImgErrors(prev => new Set(prev).add(brand.id))}
                                                />
                                            ) : (
                                                <span>{brand.logo}</span>
                                            )}
                                            <span>{brand.name}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteClick(brand, e)}
                                            title="Delete brand"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.4, color: 'inherit', display: 'flex', alignItems: 'center' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'inherit'; }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}

                            {/* Create Brand Button at bottom */}
                            <div className={styles.brandMenuDivider} />
                            <button
                                className={styles.createBrandButton}
                                onClick={handleOpenCreateModal}
                                type="button"
                            >
                                <Plus size={16} />
                                <span>Create Brand</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Brand Modal */}
            <CreateBrandModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreated={handleBrandCreated}
                isDarkMode={isDarkMode}
            />

            {/* Delete Confirmation Modal */}
            {deleteConfirmBrand && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    }}
                    onClick={() => !isDeleting && setDeleteConfirmBrand(null)}
                >
                    <div
                        style={{
                            background: isDarkMode ? '#1a1a2e' : '#fff',
                            borderRadius: 12, padding: 24, width: 360,
                            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 8px', fontSize: 16, color: isDarkMode ? '#fff' : '#111' }}>
                            Delete Brand
                        </h3>
                        <p style={{ margin: '0 0 20px', fontSize: 14, color: isDarkMode ? '#aaa' : '#555' }}>
                            Are you sure you want to delete <strong>{deleteConfirmBrand.name}</strong>? All collections, products, and generations under this brand will be permanently removed.
                        </p>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setDeleteConfirmBrand(null)}
                                disabled={isDeleting}
                                style={{
                                    padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                                    background: isDarkMode ? '#2a2a3e' : '#f0f0f0',
                                    border: 'none', color: isDarkMode ? '#ccc' : '#333', fontSize: 13,
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                                style={{
                                    padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                                    background: '#ef4444', border: 'none', color: '#fff', fontSize: 13,
                                    opacity: isDeleting ? 0.7 : 1,
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}
                            >
                                {isDeleting && <Loader2 size={14} className={styles.spinner} />}
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BrandSelect;
