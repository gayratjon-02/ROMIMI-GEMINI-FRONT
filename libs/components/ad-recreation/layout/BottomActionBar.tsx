// libs/components/ad-recreation/layout/BottomActionBar.tsx
import React from 'react';
import { Sparkles, Loader2, User, Crown } from 'lucide-react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

interface BottomActionBarProps {
    // User Profile
    userName?: string;
    userPlan?: string;
    userAvatar?: string;

    // Status
    status: 'ready' | 'processing' | 'complete' | 'error';
    statusMessage?: string;
    progress?: number; // 0-100

    // Generate Action
    isGenerating: boolean;
    canGenerate: boolean;
    onGenerate: () => void;

    isDarkMode: boolean;
}

const BottomActionBar: React.FC<BottomActionBarProps> = ({
    userName = 'User',
    userPlan = 'Pro Plan',
    userAvatar,
    status,
    statusMessage,
    progress = 0,
    isGenerating,
    canGenerate,
    onGenerate,
    isDarkMode,
}) => {
    const getStatusText = () => {
        switch (status) {
            case 'processing':
                return statusMessage || 'Processing...';
            case 'complete':
                return 'Generation Complete';
            case 'error':
                return 'Error occurred';
            default:
                return 'Ready to generate';
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'processing':
                return '#f59e0b'; // Amber
            case 'complete':
                return '#10b981'; // Green
            case 'error':
                return '#ef4444'; // Red
            default:
                return isDarkMode ? '#6b7280' : '#9ca3af'; // Gray
        }
    };

    // Get initials from name
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className={`${styles.bottomActionBar} ${!isDarkMode ? styles.light : ''}`}>
            {/* Left: User Profile */}
            <div className={styles.userSection}>
                <div className={styles.userAvatar}>
                    {userAvatar ? (
                        <img src={userAvatar} alt={userName} />
                    ) : (
                        <span>{getInitials(userName)}</span>
                    )}
                </div>
                <div className={styles.userInfo}>
                    <span className={styles.userName}>{userName}</span>
                    <span className={styles.userPlan}>
                        <Crown size={12} />
                        {userPlan}
                    </span>
                </div>
            </div>

            {/* Center: Status Indicator */}
            <div className={styles.statusSection}>
                <div className={styles.statusText} style={{ color: getStatusColor() }}>
                    {status === 'processing' && (
                        <Loader2 size={14} className={styles.spinnerSmall} />
                    )}
                    {getStatusText()}
                </div>
                {status === 'processing' && progress > 0 && (
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Right: Generate Button */}
            <div className={styles.actionSection}>
                <button
                    className={`${styles.generateButtonLarge} ${isGenerating ? styles.loading : ''}`}
                    onClick={onGenerate}
                    disabled={!canGenerate || isGenerating}
                    type="button"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className={styles.spinner} size={20} />
                            <span>Dreaming...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            <span>Generate Ad</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default BottomActionBar;
