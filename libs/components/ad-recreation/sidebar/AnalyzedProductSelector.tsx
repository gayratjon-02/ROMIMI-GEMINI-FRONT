// libs/components/ad-recreation/sidebar/AnalyzedProductSelector.tsx
// Simple sidebar button that opens AnalyzedProductsPanel in the main area
import React from 'react';
import { Package, ChevronRight } from 'lucide-react';

interface AnalyzedProductSelectorProps {
    isDarkMode: boolean;
    count: number;
    isActive: boolean;
    onClick: () => void;
}

const AnalyzedProductSelector: React.FC<AnalyzedProductSelectorProps> = ({
    isDarkMode,
    count,
    isActive,
    onClick,
}) => {
    return (
        <div style={{ marginBottom: '0' }}>
            <label
                style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    marginBottom: '6px',
                    display: 'block',
                }}
            >
                Analyzed Products
            </label>
            <button
                type="button"
                onClick={onClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '12px 16px',
                    background: isActive
                        ? (isDarkMode ? 'rgba(124, 77, 255, 0.15)' : 'rgba(124, 77, 255, 0.1)')
                        : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                    border: isActive
                        ? '1px solid #7c4dff'
                        : '1px solid rgba(124, 77, 255, 0.3)',
                    borderLeft: isActive ? '3px solid #7c4dff' : '1px solid rgba(124, 77, 255, 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: isDarkMode ? '#fff' : '#1a1a2e',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    textAlign: 'left',
                }}
                onMouseEnter={e => {
                    if (!isActive) {
                        e.currentTarget.style.background = isDarkMode
                            ? 'rgba(124, 77, 255, 0.08)'
                            : 'rgba(124, 77, 255, 0.06)';
                    }
                }}
                onMouseLeave={e => {
                    if (!isActive) {
                        e.currentTarget.style.background = isDarkMode
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,0,0,0.05)';
                    }
                }}
            >
                <Package size={16} style={{ opacity: 0.6, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>
                    <strong>{count}</strong> Analyzed Products
                </span>
                <ChevronRight size={16} style={{ opacity: 0.4, flexShrink: 0 }} />
            </button>
        </div>
    );
};

export default AnalyzedProductSelector;
