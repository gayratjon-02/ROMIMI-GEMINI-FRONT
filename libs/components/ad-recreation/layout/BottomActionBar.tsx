// libs/components/ad-recreation/layout/BottomActionBar.tsx
import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, Crown } from 'lucide-react';
import { getUserInfo, UserInfo } from '@/libs/server/HomePage/signup';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

interface BottomActionBarProps {
    // Status
    status: 'ready' | 'processing' | 'complete' | 'error';
    statusMessage?: string;
    progress?: number; // 0-100

    // Generate Action
    isGenerating: boolean;
    canGenerate: boolean;
    onGenerate: () => void;
    onLogout: () => void;

    isDarkMode: boolean;
}

const BottomActionBar: React.FC<BottomActionBarProps> = ({
    status,
    statusMessage,
    progress = 0,
    isGenerating,
    canGenerate,
    onGenerate,
    onLogout,
    isDarkMode,
}) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    // Load user info on mount
    useEffect(() => {
        const loadUser = () => {
            const userInfo = getUserInfo();
            setUser(userInfo);
            setIsLoadingUser(false);
        };
        loadUser();
    }, []);

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

    // Get display name (first name or email prefix)
    const getDisplayName = (): string => {
        if (user?.name) return user.name;
        if (user?.email) return user.email.split('@')[0];
        return 'User';
    };

    return (
        <div className={`${styles.bottomActionBar} ${!isDarkMode ? styles.light : ''}`}>
            {/* Left: User Profile with Logout */}
            <div className={styles.userSection}>
                {isLoadingUser ? (
                    // Skeleton loader for user section
                    <>
                        <div className={`${styles.userAvatar} ${styles.skeleton}`}>
                            <div className={styles.skeletonPulse} />
                        </div>
                        <div className={styles.userInfo}>
                            <span className={`${styles.userName} ${styles.skeleton}`} style={{ width: 80, height: 14 }}>
                                <span className={styles.skeletonPulse} />
                            </span>
                            <span className={`${styles.userPlan} ${styles.skeleton}`} style={{ width: 60, height: 12 }}>
                                <span className={styles.skeletonPulse} />
                            </span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={styles.userAvatar}>
                            <span>{getInitials(getDisplayName())}</span>
                        </div>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{getDisplayName()}</span>
                            <span className={styles.userPlan}>
                                <Crown size={12} />
                                Pro Plan
                            </span>
                        </div>
                        <button
                            className={styles.logoutBtnSmall}
                            onClick={onLogout}
                            type="button"
                        >
                            Logout
                        </button>
                    </>
                )}
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
