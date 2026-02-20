// libs/components/ad-recreation/sidebar/AngleSelector.tsx
// Dropdown/Accordion style with 22 angles grouped by category
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    name?: string; // Support for custom brand angles
    description?: string; // Support for custom brand angles
}

export const MARKETING_ANGLES: Angle[] = [
    // PROBLEM-FOCUSED (4)
    { id: 'problem_solution', label: 'Problem / Solution', desc: 'Present pain point, position as solution', icon: '🩹', category: 'Problem-Focused' },
    { id: 'before_after', label: 'Before & After', desc: 'Show dramatic transformation', icon: '🦋', category: 'Problem-Focused' },
    { id: 'myth_buster', label: 'Myth Buster', desc: 'Debunk common misconception', icon: '💡', category: 'Problem-Focused' },
    { id: 'contrast', label: 'Contrast', desc: 'Juxtapose opposing scenarios', icon: '⚖️', category: 'Problem-Focused' },

    // TRUST & PROOF (5)
    { id: 'social_proof', label: 'Social Proof', desc: 'Testimonials & ratings', icon: '⭐', category: 'Trust & Proof' },
    { id: 'expert_endorsement', label: 'Expert Endorsement', desc: 'Authority figures vouch', icon: '🎓', category: 'Trust & Proof' },
    { id: 'user_generated', label: 'User Generated', desc: 'Real customer content', icon: '📸', category: 'Trust & Proof' },
    { id: 'guarantee', label: 'Guarantee', desc: 'Money-back or satisfaction', icon: '🛡️', category: 'Trust & Proof' },
    { id: 'fomo', label: 'Urgency / FOMO', desc: 'Limited-time or scarcity', icon: '⏰', category: 'Trust & Proof' },

    // VALUE & FEATURES (4)
    { id: 'cost_savings', label: 'Cost Savings', desc: 'ROI & value-for-money', icon: '💵', category: 'Value & Features' },
    { id: 'feature_highlight', label: 'Feature Highlight', desc: 'Spotlight key feature', icon: '✨', category: 'Value & Features' },
    { id: 'benefit_stacking', label: 'Benefit Stacking', desc: 'List multiple benefits', icon: '📋', category: 'Value & Features' },
    { id: 'us_vs_them', label: 'Us vs. Competitors', desc: 'Compare advantages', icon: '🥊', category: 'Value & Features' },

    // ENGAGEMENT (4)
    { id: 'storytelling', label: 'Storytelling', desc: 'Emotional narrative arc', icon: '📖', category: 'Engagement' },
    { id: 'educational', label: 'Educational', desc: 'Teach while introducing product', icon: '🎓', category: 'Engagement' },
    { id: 'how_to', label: 'How To', desc: 'Step-by-step process', icon: '📝', category: 'Engagement' },
    { id: 'curiosity_gap', label: 'Curiosity Gap', desc: 'Tease intriguing result', icon: '🔮', category: 'Engagement' },
    { id: 'question', label: 'Question', desc: 'Hook with provocative question', icon: '❓', category: 'Engagement' },

    // LIFESTYLE & BRAND (5)
    { id: 'lifestyle', label: 'Lifestyle', desc: 'Associate with aspirational identity', icon: '🌴', category: 'Lifestyle & Brand' },
    { id: 'luxury', label: 'Luxury', desc: 'Premium quality & elegance', icon: '💎', category: 'Lifestyle & Brand' },
    { id: 'minimalist', label: 'Minimalist', desc: 'Clean design, product speaks', icon: '⬜', category: 'Lifestyle & Brand' },
    { id: 'urgent', label: 'Urgent', desc: 'Countdown & deadline messaging', icon: '🔥', category: 'Lifestyle & Brand' },
];

const MAX_ANGLES = 6;
const AUTO_CLOSE_DELAY = 4000; // 4 seconds

interface AngleSelectorProps {
    selected: string[];
    onChange: (id: string) => void;
    isDarkMode: boolean;
    dynamicAngles?: Angle[]; // From API (predefined + custom)
    brandId?: string | null;
}

const AngleSelector: React.FC<AngleSelectorProps> = ({
    selected,
    onChange,
    isDarkMode,
    dynamicAngles = MARKETING_ANGLES,
    brandId,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Custom Angle Modal State
    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customDesc, setCustomDesc] = useState('');
    const [customHook, setCustomHook] = useState('');
    const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

    // Group angles by category
    const groupedAngles = dynamicAngles.reduce((acc, angle) => {
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

    // Clear any pending close timer
    const clearCloseTimer = useCallback(() => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    }, []);

    // Start 4s auto-close timer when mouse leaves
    const handleMouseLeave = useCallback(() => {
        if (!isExpanded) return;
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => {
            setIsExpanded(false);
        }, AUTO_CLOSE_DELAY);
    }, [isExpanded, clearCloseTimer]);

    // Cancel timer when mouse re-enters
    const handleMouseEnter = useCallback(() => {
        clearCloseTimer();
    }, [clearCloseTimer]);

    // Click outside → close immediately
    useEffect(() => {
        if (!isExpanded) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                clearCloseTimer();
                setIsExpanded(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded, clearCloseTimer]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => clearCloseTimer();
    }, [clearCloseTimer]);

    const handleCreateCustomAngle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!brandId || !customName || !customDesc || !customHook) return;

        setIsSubmittingCustom(true);
        try {
            const { addCustomAngle } = await import('@/libs/server/Ad-Recreation/brand/brand.service');
            await addCustomAngle(brandId, {
                name: customName,
                description: customDesc,
                hook: customHook,
            });
            // Reset form and close modal
            setCustomName('');
            setCustomDesc('');
            setCustomHook('');
            setIsAddingCustom(false);
            // We don't need to manually update dynamicAngles here because
            // the parent (index.tsx) could potentially re-fetch, OR the user
            // can just see it on the next load. For immediate UI feedback, 
            // the parent should re-fetch angles. We'll show an alert for P0.
            alert('Custom angle added successfully. It will appear when you re-select the brand.');
        } catch (error) {
            console.error('Failed to create custom angle:', error);
            alert('Failed to add custom angle.');
        } finally {
            setIsSubmittingCustom(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className={styles.section}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ position: 'relative' }}
        >
            <label className={styles.sectionLabel}>Marketing Angles</label>

            {/* Dropdown Header - Click to toggle */}
            <div
                onClick={() => setIsExpanded(prev => !prev)}
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
                    transition: 'border-color 0.2s',
                }}
            >
                <span>
                    <strong>{selected.length}/{MAX_ANGLES}</strong> selected: {getSelectedLabels()}
                </span>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

            {/* Dropdown Content */}
            {isExpanded && (
                <div
                    className={styles.dropdownContent}
                    style={{
                        marginTop: '4px',
                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: '1px solid rgba(124, 77, 255, 0.2)',
                        borderRadius: '8px',
                        maxHeight: '500px',
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
                                        <span style={{ fontSize: '16px' }}>{angle.icon || '🏷️'}</span>

                                        {/* Label & Desc */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 500 }}>
                                                {angle.label || angle.name}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '11px',
                                                    opacity: 0.6,
                                                    marginTop: '2px',
                                                }}
                                            >
                                                {angle.desc || angle.description}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ))}

                    {/* Add Custom Angle Button */}
                    {brandId && (
                        <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(124, 77, 255, 0.2)' }}>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearCloseTimer(); // Stop auto-close
                                    setIsAddingCustom(true);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    background: 'rgba(124, 77, 255, 0.1)',
                                    color: '#7c4dff',
                                    border: '1px dashed rgba(124, 77, 255, 0.5)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                }}
                            >
                                + Add Custom Angle for Brand
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal for adding custom angle */}
            {isAddingCustom && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                    }}
                    onClick={() => setIsAddingCustom(false)}
                >
                    <div
                        style={{
                            background: isDarkMode ? '#1a1a2e' : '#fff',
                            padding: '24px',
                            borderRadius: '12px',
                            width: '400px',
                            maxWidth: '90vw',
                            border: '1px solid rgba(124, 77, 255, 0.3)',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 16px', color: isDarkMode ? '#fff' : '#1a1a2e' }}>Create Custom Angle</h3>
                        <form onSubmit={handleCreateCustomAngle}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: isDarkMode ? '#ccc' : '#666' }}>Name</label>
                                <input
                                    required
                                    value={customName}
                                    onChange={e => setCustomName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f5f5f7',
                                        border: '1px solid rgba(124, 77, 255, 0.2)',
                                        borderRadius: '6px',
                                        color: isDarkMode ? '#fff' : '#1a1a2e',
                                    }}
                                    placeholder="e.g., Seasonal Promo"
                                />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: isDarkMode ? '#ccc' : '#666' }}>Description</label>
                                <input
                                    required
                                    value={customDesc}
                                    onChange={e => setCustomDesc(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f5f5f7',
                                        border: '1px solid rgba(124, 77, 255, 0.2)',
                                        borderRadius: '6px',
                                        color: isDarkMode ? '#fff' : '#1a1a2e',
                                    }}
                                    placeholder="e.g., Focus on holiday discounts"
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: isDarkMode ? '#ccc' : '#666' }}>Hook (First 3 seconds)</label>
                                <textarea
                                    required
                                    value={customHook}
                                    onChange={e => setCustomHook(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f5f5f7',
                                        border: '1px solid rgba(124, 77, 255, 0.2)',
                                        borderRadius: '6px',
                                        color: isDarkMode ? '#fff' : '#1a1a2e',
                                        minHeight: '80px',
                                        resize: 'vertical'
                                    }}
                                    placeholder="How to grab attention immediately..."
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCustom(false)}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'transparent',
                                        border: 'none',
                                        color: isDarkMode ? '#ccc' : '#666',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingCustom}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#7c4dff',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontWeight: 500,
                                        cursor: isSubmittingCustom ? 'wait' : 'pointer',
                                        opacity: isSubmittingCustom ? 0.7 : 1
                                    }}
                                >
                                    {isSubmittingCustom ? 'Saving...' : 'Save Angle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AngleSelector;
