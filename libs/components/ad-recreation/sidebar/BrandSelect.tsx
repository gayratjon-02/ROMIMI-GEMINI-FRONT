// libs/components/ad-recreation/sidebar/BrandSelect.tsx
import React, { useState, useEffect } from 'react';
import { ChevronDown, Loader2, Plus } from 'lucide-react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';
import { fetchAdBrands, AdBrand } from '@/libs/server/Ad-Recreation/brand/brand.service';
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
                                    <button
                                        key={brand.id}
                                        className={`${styles.brandOption} ${selectedBrandId === brand.id ? styles.selected : ''
                                            }`}
                                        onClick={() => handleSelect(brand.id)}
                                        type="button"
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
        </>
    );
};

export default BrandSelect;
