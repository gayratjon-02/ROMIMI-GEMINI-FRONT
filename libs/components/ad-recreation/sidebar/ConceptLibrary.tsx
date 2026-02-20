// libs/components/ad-recreation/sidebar/ConceptLibrary.tsx
// Dropdown list of previously analyzed Inspirations (Concepts).
// Selects one → sends its analysis_json to the center panel.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Image, Loader2 } from 'lucide-react';
import styles from '@/scss/styles/AdRecreation/AdRecreation.module.scss';

const AUTO_CLOSE_DELAY = 3000; // 3 seconds

export interface ConceptItem {
    id: string;
    name?: string;
    original_image_url: string;
    analysis_json: any;
    tags?: string[];
    created_at: string;
}

interface ConceptLibraryProps {
    concepts: ConceptItem[];
    selectedConceptId: string | null;
    onSelect: (concept: ConceptItem) => void;
    isDarkMode: boolean;
    isLoading?: boolean;
}

const ConceptLibrary: React.FC<ConceptLibraryProps> = ({
    concepts,
    selectedConceptId,
    onSelect,
    isDarkMode,
    isLoading = false,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Clear any pending close timer
    const clearCloseTimer = useCallback(() => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    }, []);

    // Start 3s auto-close timer when mouse leaves
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

    const getSelectedLabel = () => {
        if (!selectedConceptId) return 'None selected';
        const found = concepts.find(c => c.id === selectedConceptId);
        if (!found) return 'None selected';
        return found.name || `Inspiration ${concepts.indexOf(found) + 1}`;
    };

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
            return '';
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
            <label className={styles.sectionLabel}>Inspiration Library</label>

            {/* Dropdown Header — Click to toggle */}
            <div
                onClick={() => setIsExpanded(prev => !prev)}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    padding: '12px 16px',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    border: `1px solid ${selectedConceptId ? '#7c4dff' : 'rgba(124, 77, 255, 0.3)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: isDarkMode ? '#fff' : '#1a1a2e',
                    fontSize: '14px',
                    transition: 'border-color 0.2s',
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Image size={15} style={{ opacity: 0.6 }} />
                    <strong>{concepts.length}</strong> saved: {getSelectedLabel()}
                </span>
                {isLoading ? (
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                    isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />
                )}
            </div>

            {/* Dropdown Content */}
            {isExpanded && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        background: isDarkMode ? '#1a1a2e' : '#ffffff',
                        border: '1px solid rgba(124, 77, 255, 0.3)',
                        boxShadow: isDarkMode
                            ? '0 -8px 32px rgba(0,0,0,0.5)'
                            : '0 -8px 32px rgba(124, 77, 255, 0.15)',
                        borderRadius: '8px',
                        maxHeight: '60vh',
                        overflowY: 'auto',
                    }}
                >
                    {concepts.length === 0 ? (
                        <div
                            style={{
                                padding: '24px 16px',
                                textAlign: 'center',
                                color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                fontSize: '13px',
                            }}
                        >
                            No inspirations analyzed yet.
                            <br />
                            Upload an ad above to get started.
                        </div>
                    ) : (
                        concepts.map((concept, idx) => {
                            const isSelected = selectedConceptId === concept.id;
                            const label = concept.name || `Inspiration ${idx + 1}`;

                            return (
                                <button
                                    key={concept.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(concept);
                                        setIsExpanded(false);
                                    }}
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
                                        borderBottom: '1px solid rgba(124, 77, 255, 0.08)',
                                        cursor: 'pointer',
                                        color: isDarkMode ? '#fff' : '#1a1a2e',
                                        textAlign: 'left',
                                        transition: 'background 0.15s',
                                    }}
                                >
                                    {/* Thumbnail */}
                                    <div
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '6px',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                            border: isSelected
                                                ? '2px solid #7c4dff'
                                                : '1px solid rgba(124, 77, 255, 0.2)',
                                        }}
                                    >
                                        <img
                                            src={concept.original_image_url}
                                            alt={label}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    </div>

                                    {/* Label & Meta */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: '13px',
                                                fontWeight: isSelected ? 600 : 500,
                                                color: isSelected ? '#7c4dff' : undefined,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {label}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '11px',
                                                opacity: 0.5,
                                                display: 'flex',
                                                gap: '6px',
                                                marginTop: '2px',
                                            }}
                                        >
                                            <span>{formatDate(concept.created_at)}</span>
                                            {concept.tags && concept.tags.length > 0 && (
                                                <span>• {concept.tags.slice(0, 2).join(', ')}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Active indicator */}
                                    {isSelected && (
                                        <div
                                            style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: '#7c4dff',
                                                flexShrink: 0,
                                            }}
                                        />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default ConceptLibrary;
