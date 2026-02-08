// libs/components/ad-recreation/sidebar/AngleSelector.tsx
import React from 'react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

export interface Angle {
    id: string;
    label: string;
    desc: string;
    icon: string;
}

interface AngleSelectorProps {
    angles: Angle[];
    selected: string[];
    onChange: (id: string) => void;
    isDarkMode: boolean;
}

const AngleSelector: React.FC<AngleSelectorProps> = ({
    angles,
    selected,
    onChange,
    isDarkMode,
}) => {
    return (
        <div className={styles.section}>
            <label className={styles.sectionLabel}>Marketing Angles</label>
            <div className={styles.angleGrid}>
                {angles.map(angle => (
                    <button
                        key={angle.id}
                        className={`${styles.angleCard} ${selected.includes(angle.id) ? styles.selected : ''
                            }`}
                        onClick={() => onChange(angle.id)}
                        type="button"
                    >
                        <div className={styles.angleIcon}>{angle.icon}</div>
                        <div className={styles.angleLabel}>{angle.label}</div>
                        <div className={styles.angleDesc}>{angle.desc}</div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AngleSelector;
