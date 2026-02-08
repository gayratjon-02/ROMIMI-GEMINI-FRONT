// libs/components/ad-recreation/sidebar/ModeToggle.tsx
import React from 'react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

interface ModeToggleProps {
    activeMode: 'single' | 'batch';
    onChange: (mode: 'single' | 'batch') => void;
    isDarkMode: boolean;
}

const ModeToggle: React.FC<ModeToggleProps> = ({
    activeMode,
    onChange,
    isDarkMode,
}) => {
    return (
        <div className={styles.section}>
            <label className={styles.sectionLabel}>Mode</label>
            <div className={styles.modeToggle}>
                <button
                    className={`${styles.modeOption} ${activeMode === 'single' ? styles.active : ''}`}
                    onClick={() => onChange('single')}
                    type="button"
                >
                    Single Concept
                </button>
                <button
                    className={`${styles.modeOption} ${styles.disabled}`}
                    disabled
                    title="Coming soon in P1"
                    type="button"
                >
                    Batch Mode
                </button>
            </div>
        </div>
    );
};

export default ModeToggle;
