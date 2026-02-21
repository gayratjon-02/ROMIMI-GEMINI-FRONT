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
        id: 'pain_back',
        label: 'Back Pain',
        desc: 'Target chronic back pain sufferers',
        icon: '🩹'
    },
    {
        id: 'proof_reviews',
        label: 'Reviews',
        desc: '2,400+ five-star reviews',
        icon: '⭐'
    },
    {
        id: 'value_savings',
        label: 'Cost Savings',
        desc: 'Save 1,200+/year vs gym',
        icon: '💰'
    },
    {
        id: 'emotional_confidence',
        label: 'Confidence',
        desc: 'Stand taller, literally and figuratively',
        icon: '👑'
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
        angle: 'pain_back',
        format: 'story',
        imageUrl: 'https://placehold.co/1080x1920/1a1a2e/FFF?text=Back+Pain+Relief',
        headline: 'MY BACK WAS GETTING WORSE EVERY DAY',
        cta: 'FIX YOUR BACK',
        subtext: 'Feel the difference after just 4 weeks'
    },
    {
        id: '2',
        angle: 'proof_reviews',
        format: 'story',
        imageUrl: 'https://placehold.co/1080x1920/1a2e1a/FFF?text=5+Star+Reviews',
        headline: '2,400+ FIVE-STAR REVIEWS',
        cta: 'SEE WHY THEY LOVE IT',
        subtext: '★★★★★ Verified customer reviews'
    },
    {
        id: '3',
        angle: 'value_savings',
        format: 'square',
        imageUrl: 'https://placehold.co/1080x1080/2e1a1a/FFF?text=Save+1200+Per+Year',
        headline: 'SAVE OVER 1,200 PER YEAR',
        cta: 'START SAVING',
        subtext: 'One-time cost vs expensive gym memberships'
    },
    {
        id: '4',
        angle: 'emotional_confidence',
        format: 'portrait',
        imageUrl: 'https://placehold.co/1080x1350/0a0a14/FFF?text=Confidence',
        headline: 'I STAND TALLER NOW',
        cta: 'FEEL CONFIDENT',
        subtext: 'Literally and figuratively'
    },
];

export type Brand = typeof MOCK_BRANDS[0];
export type Angle = typeof MOCK_ANGLES[0];
export type Format = typeof MOCK_FORMATS[0];
export type MockResult = typeof MOCK_RESULTS[0];
