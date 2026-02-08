// libs/components/ad-recreation/sidebar/AngleSelector.tsx
// Dropdown/Accordion style with 22 angles grouped by category
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

// ============================================
// MARKETING ANGLES - 22 Options by Category
// ============================================

export interface Angle {
    id: string;
    label: string;
    desc: string;
    icon: string;
    category: string;
}

export const MARKETING_ANGLES: Angle[] = [
    // PAIN POINTS (4)
    { id: 'back_pain', label: 'Back Pain', desc: 'Relief from chronic back issues', icon: '🩹', category: 'Pain Points' },
    { id: 'low_energy', label: 'Low Energy', desc: 'Boost daily energy levels', icon: '⚡', category: 'Pain Points' },
    { id: 'poor_posture', label: 'Poor Posture', desc: 'Fix posture problems', icon: '🧘', category: 'Pain Points' },
    { id: 'exercise_guilt', label: 'Exercise Guilt', desc: 'End workout shame', icon: '😔', category: 'Pain Points' },

    // OBJECTIONS (5)
    { id: 'no_time', label: 'No Time', desc: 'Quick & efficient workouts', icon: '⏰', category: 'Objections' },
    { id: 'beginner_fear', label: 'Beginner Fear', desc: 'Easy for beginners', icon: '👶', category: 'Objections' },
    { id: 'skeptic_partner', label: 'Skeptic Partner', desc: 'Convince the skeptics', icon: '🤔', category: 'Objections' },
    { id: 'too_expensive', label: 'Too Expensive', desc: 'Worth every penny', icon: '💰', category: 'Objections' },
    { id: 'no_space', label: 'No Space', desc: 'Compact & portable', icon: '📦', category: 'Objections' },

    // VALUE (4)
    { id: 'cost_savings', label: 'Cost Savings', desc: 'Save money long-term', icon: '💵', category: 'Value' },
    { id: 'convenience', label: 'Convenience', desc: 'Use anywhere, anytime', icon: '🏠', category: 'Value' },
    { id: 'bundle_value', label: 'Bundle Value', desc: 'Get more for less', icon: '🎁', category: 'Value' },
    { id: 'fast_delivery', label: 'Fast Delivery', desc: 'Quick shipping', icon: '🚚', category: 'Value' },

    // SOCIAL PROOF (4)
    { id: 'statistics', label: 'Statistics', desc: 'Data-backed results', icon: '📊', category: 'Social Proof' },
    { id: 'reviews', label: 'Reviews', desc: 'Customer testimonials', icon: '⭐', category: 'Social Proof' },
    { id: 'community', label: 'Community', desc: 'Join thousands of users', icon: '👥', category: 'Social Proof' },
    { id: 'word_of_mouth', label: 'Word of Mouth', desc: 'Recommended by friends', icon: '🗣️', category: 'Social Proof' },

    // EMOTIONAL (5)
    { id: 'strength', label: 'Strength', desc: 'Feel powerful & capable', icon: '💪', category: 'Emotional' },
    { id: 'self_care', label: 'Self-Care', desc: 'Invest in yourself', icon: '🧖', category: 'Emotional' },
    { id: 'family', label: 'Family', desc: 'Be there for loved ones', icon: '👨‍👩‍👧', category: 'Emotional' },
    { id: 'confidence', label: 'Confidence', desc: 'Boost self-esteem', icon: '✨', category: 'Emotional' },
    { id: 'transformation', label: 'Transformation', desc: 'Before & after journey', icon: '🦋', category: 'Emotional' },
];

const MAX_ANGLES = 6;

interface AngleSelectorProps {
    selected: string[];
    onChange: (id: string) => void;
    isDarkMode: boolean;
}

const AngleSelector: React.FC<AngleSelectorProps> = ({
    selected,
    onChange,
    isDarkMode,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Group angles by category
    const groupedAngles = MARKETING_ANGLES.reduce((acc, angle) => {
        if (!acc[angle.category]) {
            acc[angle.category] = [];
        }
        acc[angle.category].push(angle);
        return acc;
    }, {} as Record<string, Angle[]>);

    const handleToggle = (id: string) => {
        if (selected.includes(id)) {
            onChange(id); // Remove
        } else if (selected.length < MAX_ANGLES) {
            onChange(id); // Add
        }
    };

    const getSelectedLabels = () => {
        if (selected.length === 0) return 'None selected';
        const labels = selected
            .map(id => MARKETING_ANGLES.find(a => a.id === id)?.label)
            .filter(Boolean)
            .slice(0, 3);
        if (selected.length > 3) {
            return `${labels.join(', ')} +${selected.length - 3}`;
        }
        return labels.join(', ');
    };

    return (
        <div className={styles.section}>
            <label className={styles.sectionLabel}>Marketing Angles</label>

            {/* Dropdown Header */}
            <button
                type="button"
                className={`${styles.dropdownHeader} ${isExpanded ? styles.expanded : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    padding: '12px 16px',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    border: '1px solid rgba(124, 77, 255, 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: isDarkMode ? '#fff' : '#1a1a2e',
                    fontSize: '14px',
                }}
            >
                <span>
                    <strong>{selected.length}/{MAX_ANGLES}</strong> selected: {getSelectedLabels()}
                </span>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {/* Dropdown Content */}
            {isExpanded && (
                <div
                    className={styles.dropdownContent}
                    style={{
                        marginTop: '8px',
                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: '1px solid rgba(124, 77, 255, 0.2)',
                        borderRadius: '8px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                    }}
                >
                    {Object.entries(groupedAngles).map(([category, angles]) => (
                        <div key={category} style={{ marginBottom: '8px' }}>
                            {/* Category Header */}
                            <div
                                style={{
                                    padding: '8px 12px',
                                    background: isDarkMode ? 'rgba(124, 77, 255, 0.15)' : 'rgba(124, 77, 255, 0.1)',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    color: '#7c4dff',
                                    borderBottom: '1px solid rgba(124, 77, 255, 0.2)',
                                }}
                            >
                                {category} ({angles.length})
                            </div>

                            {/* Angle Items */}
                            {angles.map(angle => {
                                const isSelected = selected.includes(angle.id);
                                const isDisabled = !isSelected && selected.length >= MAX_ANGLES;

                                return (
                                    <button
                                        key={angle.id}
                                        type="button"
                                        onClick={() => handleToggle(angle.id)}
                                        disabled={isDisabled}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            width: '100%',
                                            padding: '10px 12px',
                                            background: isSelected
                                                ? 'rgba(124, 77, 255, 0.15)'
                                                : 'transparent',
                                            border: 'none',
                                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                                            opacity: isDisabled ? 0.5 : 1,
                                            color: isDarkMode ? '#fff' : '#1a1a2e',
                                            textAlign: 'left',
                                            transition: 'background 0.15s',
                                        }}
                                    >
                                        {/* Checkbox */}
                                        <div
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                borderRadius: '4px',
                                                border: isSelected
                                                    ? '2px solid #7c4dff'
                                                    : '2px solid rgba(255,255,255,0.3)',
                                                background: isSelected ? '#7c4dff' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {isSelected && <Check size={12} color="#fff" />}
                                        </div>

                                        {/* Icon */}
                                        <span style={{ fontSize: '16px' }}>{angle.icon}</span>

                                        {/* Label & Desc */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 500 }}>
                                                {angle.label}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '11px',
                                                    opacity: 0.6,
                                                    marginTop: '2px',
                                                }}
                                            >
                                                {angle.desc}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AngleSelector;
