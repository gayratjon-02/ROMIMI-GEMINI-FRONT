// libs/components/ad-recreation/sidebar/GenerateBtn.tsx
import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

interface GenerateBtnProps {
    isLoading: boolean;
    disabled: boolean;
    onClick: () => void;
}

const GenerateBtn: React.FC<GenerateBtnProps> = ({
    isLoading,
    disabled,
    onClick,
}) => {
    return (
        <div className={styles.sidebarFooter}>
            <button
                className={`${styles.generateButton} ${isLoading ? styles.loading : ''}`}
                onClick={onClick}
                disabled={disabled || isLoading}
                type="button"
            >
                {isLoading ? (
                    <>
                        <Loader2 className={styles.spinner} size={18} />
                        <span>Dreaming...</span>
                    </>
                ) : (
                    <>
                        <Sparkles size={18} />
                        <span>Generate Ad</span>
                    </>
                )}
            </button>
        </div>
    );
};

export default GenerateBtn;
