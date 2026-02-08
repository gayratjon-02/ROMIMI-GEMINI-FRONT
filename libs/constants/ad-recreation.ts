// Ad Recreation Mock Data Constants
// This file contains all hardcoded mock data for the Ad Recreation module

export const MOCK_BRANDS = [
    { id: 'nike', name: 'Nike', logo: '🏃' },
    { id: 'adidas', name: 'Adidas', logo: '⚽' },
    { id: 'puma', name: 'Puma', logo: '🐆' },
    { id: 'apple', name: 'Apple', logo: '🍎' },
];

export const MOCK_ANGLES = [
    {
        id: 'problem_solution',
        label: 'Problem / Solution',
        desc: 'Solve a pain point',
        icon: '💡'
    },
    {
        id: 'social_proof',
        label: 'Social Proof',
        desc: 'Customer reviews & trust',
        icon: '⭐'
    },
    {
        id: 'fomo',
        label: 'FOMO',
        desc: 'Urgency & scarcity',
        icon: '⏰'
    },
    {
        id: 'minimalist',
        label: 'Minimalist',
        desc: 'Clean & elegant design',
        icon: '✨'
    },
];

export const MOCK_FORMATS = [
    { id: 'story', label: '9:16', name: 'Story', width: 1080, height: 1920 },
    { id: 'square', label: '1:1', name: 'Post', width: 1080, height: 1080 },
    { id: 'portrait', label: '4:5', name: 'Portrait', width: 1080, height: 1350 },
    { id: 'landscape', label: '16:9', name: 'Landscape', width: 1920, height: 1080 },
];

export const MOCK_CONCEPT_JSON = {
    zones: {
        headline: {
            position: 'top',
            text: 'STOP SETTLING FOR HEAVY SHOES',
            style: 'bold_uppercase',
            color: '#FFFFFF'
        },
        image: {
            position: 'center',
            type: 'product_hero',
            subject: 'Nike Air Zoom running shoe',
            background: 'gradient_dark'
        },
        cta: {
            position: 'bottom',
            text: 'RUN FASTER NOW',
            style: 'button_primary',
            color: '#FF5722'
        }
    },
    style: {
        palette: ['#1a1a1a', '#ffffff', '#ff5722'],
        mood: 'energetic',
        typography: 'modern_sans'
    }
};

export const MOCK_RESULTS = [
    {
        id: '1',
        angle: 'problem_solution',
        format: 'story',
        imageUrl: 'https://placehold.co/1080x1920/1a1a2e/FFF?text=Nike+Air+Zoom',
        headline: 'STOP SETTLING FOR HEAVY SHOES',
        cta: 'RUN FASTER NOW',
        subtext: 'Feel the difference with 40% lighter soles'
    },
    {
        id: '2',
        angle: 'social_proof',
        format: 'story',
        imageUrl: 'https://placehold.co/1080x1920/1a2e1a/FFF?text=5+Star+Reviews',
        headline: 'TRUSTED BY 10M+ RUNNERS',
        cta: 'JOIN THE MOVEMENT',
        subtext: '★★★★★ 4.9/5 from verified buyers'
    },
    {
        id: '3',
        angle: 'fomo',
        format: 'square',
        imageUrl: 'https://placehold.co/1080x1080/2e1a1a/FFF?text=Limited+Edition',
        headline: 'ONLY 48 HOURS LEFT',
        cta: 'GRAB YOURS NOW',
        subtext: '73% already sold out'
    },
    {
        id: '4',
        angle: 'minimalist',
        format: 'portrait',
        imageUrl: 'https://placehold.co/1080x1350/0a0a14/FFF?text=Air+Zoom',
        headline: 'AIR ZOOM',
        cta: 'DISCOVER',
        subtext: 'Precision engineered for speed'
    },
];

export type Brand = typeof MOCK_BRANDS[0];
export type Angle = typeof MOCK_ANGLES[0];
export type Format = typeof MOCK_FORMATS[0];
export type MockResult = typeof MOCK_RESULTS[0];
