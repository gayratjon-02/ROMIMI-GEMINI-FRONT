// libs/components/ad-recreation/sidebar/FormatSelector.tsx
import React from 'react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

export interface Format {
    id: string;
    label: string;
    name: string;
    width: number;
    height: number;
}

interface FormatSelectorProps {
    formats: Format[];
    selected: string[];
    onChange: (id: string) => void;
    isDarkMode: boolean;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({
    formats,
    selected,
    onChange,
    isDarkMode,
}) => {
    return (
        <div className={styles.section}>
            <label className={styles.sectionLabel}>Output Formats</label>
            <div className={styles.formatRow}>
                {formats.map(format => (
                    <button
                        key={format.id}
                        className={`${styles.formatButton} ${selected.includes(format.id) ? styles.selected : ''
                            }`}
                        onClick={() => onChange(format.id)}
                        type="button"
                    >
                        <span className={styles.formatLabel}>{format.label}</span>
                        <span className={styles.formatName}>{format.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FormatSelector;
