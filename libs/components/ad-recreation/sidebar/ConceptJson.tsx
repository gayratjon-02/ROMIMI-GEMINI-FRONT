// libs/components/ad-recreation/sidebar/ConceptJson.tsx
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

interface ConceptJsonProps {
    conceptData: object;
    isVisible: boolean;
    isDarkMode: boolean;
}

const ConceptJson: React.FC<ConceptJsonProps> = ({
    conceptData,
    isVisible,
    isDarkMode,
}) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!isVisible) return null;

    return (
        <div className={styles.section}>
            <div className={styles.accordion}>
                <button
                    className={styles.accordionHeader}
                    onClick={() => setIsOpen(!isOpen)}
                    type="button"
                >
                    <span>Analysis Result (JSON)</span>
                    <ChevronDown
                        className={`${styles.accordionIcon} ${isOpen ? styles.open : ''}`}
                        size={16}
                    />
                </button>
                {isOpen && (
                    <div className={styles.accordionContent}>
                        <pre className={styles.codeBlock}>
                            {JSON.stringify(conceptData, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConceptJson;
