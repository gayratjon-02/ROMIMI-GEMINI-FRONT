// libs/components/ad-recreation/sidebar/FormatSelector.tsx
// Horizontal toggle buttons for bottom placement
import React from 'react';

export interface Format {
    id: string;
    label: string;
    name: string;
    width: number;
    height: number;
}

export const OUTPUT_FORMATS: Format[] = [
    { id: 'story', label: '9:16', name: 'Story', width: 1080, height: 1920 },
    { id: 'square', label: '1:1', name: 'Post', width: 1080, height: 1080 },
    { id: 'portrait', label: '4:5', name: 'Feed', width: 1080, height: 1350 },
    { id: 'landscape', label: '16:9', name: 'Landscape', width: 1920, height: 1080 },
];

const MAX_FORMATS = 4;

interface FormatSelectorProps {
    selected: string[];
    onChange: (id: string) => void;
    isDarkMode: boolean;
    compact?: boolean; // For bottom bar usage
}

const FormatSelector: React.FC<FormatSelectorProps> = ({
    selected,
    onChange,
    isDarkMode,
    compact = false,
}) => {
    const handleToggle = (id: string) => {
        if (selected.includes(id)) {
            // Don't allow deselecting if only one selected
            if (selected.length > 1) {
                onChange(id);
            }
        } else if (selected.length < MAX_FORMATS) {
            onChange(id);
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: compact ? '8px' : '12px',
            }}
        >
            {!compact && (
                <span
                    style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                        marginRight: '4px',
                    }}
                >
                    Formats:
                </span>
            )}
            {OUTPUT_FORMATS.map(format => {
                const isSelected = selected.includes(format.id);
                return (
                    <button
                        key={format.id}
                        type="button"
                        onClick={() => handleToggle(format.id)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: compact ? '6px 12px' : '8px 16px',
                            background: isSelected
                                ? 'linear-gradient(135deg, #7c4dff 0%, #448aff 100%)'
                                : isDarkMode
                                    ? 'rgba(255,255,255,0.08)'
                                    : 'rgba(0,0,0,0.06)',
                            border: isSelected
                                ? '1px solid rgba(124, 77, 255, 0.5)'
                                : '1px solid transparent',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: isSelected ? '#fff' : isDarkMode ? '#fff' : '#1a1a2e',
                            transition: 'all 0.2s ease',
                            minWidth: compact ? '60px' : '70px',
                        }}
                    >
                        <span
                            style={{
                                fontSize: compact ? '12px' : '13px',
                                fontWeight: 600,
                            }}
                        >
                            {format.label}
                        </span>
                        <span
                            style={{
                                fontSize: compact ? '9px' : '10px',
                                opacity: 0.7,
                                marginTop: '2px',
                            }}
                        >
                            {format.name}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default FormatSelector;
