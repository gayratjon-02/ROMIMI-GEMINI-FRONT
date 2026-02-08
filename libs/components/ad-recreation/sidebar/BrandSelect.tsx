// libs/components/ad-recreation/sidebar/BrandSelect.tsx
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

export interface Brand {
    id: string;
    name: string;
    logo: string;
}

interface BrandSelectProps {
    brands: Brand[];
    selectedBrand: Brand;
    onSelect: (brand: Brand) => void;
    isDarkMode: boolean;
}

const BrandSelect: React.FC<BrandSelectProps> = ({
    brands,
    selectedBrand,
    onSelect,
    isDarkMode,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (brand: Brand) => {
        onSelect(brand);
        setIsOpen(false);
    };

    return (
        <div className={styles.section}>
            <label className={styles.sectionLabel}>Brand</label>
            <div className={styles.brandSelector}>
                <button
                    className={styles.brandDropdown}
                    onClick={() => setIsOpen(!isOpen)}
                    type="button"
                >
                    <div className={styles.brandInfo}>
                        <span className={styles.brandLogo}>{selectedBrand.logo}</span>
                        <span className={styles.brandName}>{selectedBrand.name}</span>
                    </div>
                    <ChevronDown
                        className={`${styles.dropdownIcon} ${isOpen ? styles.open : ''}`}
                        size={16}
                    />
                </button>

                {isOpen && (
                    <div className={styles.brandMenu}>
                        {brands.map(brand => (
                            <button
                                key={brand.id}
                                className={`${styles.brandOption} ${selectedBrand.id === brand.id ? styles.selected : ''
                                    }`}
                                onClick={() => handleSelect(brand)}
                                type="button"
                            >
                                <span>{brand.logo}</span>
                                <span>{brand.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrandSelect;
