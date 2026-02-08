// libs/components/ad-recreation/sidebar/ProductForm.tsx
import React from 'react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

interface ProductFormProps {
    value: string;
    onChange: (value: string) => void;
    isDarkMode: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
    value,
    onChange,
    isDarkMode,
}) => {
    return (
        <div className={styles.section}>
            <label className={styles.sectionLabel}>Product Details</label>
            <textarea
                className={styles.productTextarea}
                placeholder="Describe your product (e.g., Nike Air Zoom, red, lightweight...)"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};

export default ProductForm;
