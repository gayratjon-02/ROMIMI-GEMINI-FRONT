// libs/components/ad-recreation/gallery/EmptyState.tsx
import React from 'react';
import { Palette } from 'lucide-react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

interface EmptyStateProps {
    isDarkMode: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ isDarkMode }) => {
    return (
        <div className={styles.emptyState}>
            <Palette className={styles.emptyIcon} size={80} strokeWidth={1} />
            <h2 className={styles.emptyTitle}>Ready to Recreate</h2>
            <p className={styles.emptySubtext}>
                Upload a reference image and select your marketing angles to begin generating stunning ad variations.
            </p>
        </div>
    );
};

export default EmptyState;
