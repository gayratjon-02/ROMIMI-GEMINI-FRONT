'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ProductJSON } from '@/libs/components/homePage/HomeMiddle';
import { Product } from '@/libs/types/homepage/product';

// ═══════════════════════════════════════════════════════════════════════════
// ProductContext — shared product-image state across Product Visuals & Ad Recreation
// ═══════════════════════════════════════════════════════════════════════════

export interface ProductContextType {
    // Image files (for new uploads)
    frontImage: File | null;
    backImage: File | null;
    referenceImages: File[];
    setFrontImage: (file: File | null) => void;
    setBackImage: (file: File | null) => void;
    setReferenceImages: (files: File[]) => void;

    // Analysis state
    isAnalyzing: boolean;
    setIsAnalyzing: (v: boolean) => void;
    productJSON: ProductJSON | null;
    setProductJSON: (json: ProductJSON | null) => void;
    productId: string | null;
    setProductId: (id: string | null) => void;
    fullAnalysisResponse: any;
    setFullAnalysisResponse: (resp: any) => void;

    // Derived flag: product is analyzed when productJSON exists
    isAnalyzed: boolean;

    // Handle product selected from catalog
    handleProductSelect: (product: Product) => void;

    // Handle analyze (wraps analyzeProductDirect)
    handleAnalyze: (forceReanalyze?: boolean) => Promise<void>;

    // Reset all product state
    resetProduct: () => void;
}

const ProductContext = createContext<ProductContextType | null>(null);

export function useProductContext(): ProductContextType {
    const ctx = useContext(ProductContext);
    if (!ctx) throw new Error('useProductContext must be used inside <ProductProvider>');
    return ctx;
}

// Helper: safely extract logo description from various formats
const getLogoDesc = (field: any): string => {
    if (!field) return 'None';
    if (typeof field === 'string') return field;
    if (typeof field === 'object' && field !== null) {
        const parts: string[] = [];
        if (field.type) parts.push(field.type);
        if (field.color && field.color.toLowerCase() !== 'unknown') parts.push(`(${field.color})`);
        if (field.position) parts.push(`at ${field.position}`);
        if (parts.length > 0) return parts.join(' ');
        if (field.description) return field.description;
        return JSON.stringify(field).replace(/[{}"]/g, '').replace(/,/g, ', ');
    }
    return String(field);
};

// Map raw analysis → ProductJSON
const mapAnalysisToProductJSON = (analysis: any, fallbackName?: string): ProductJSON => ({
    type: analysis.general_info?.product_name || fallbackName || 'Product',
    color: analysis.colors?.primary?.name || 'Not detected',
    color_hex: analysis.colors?.primary?.hex || '#000000',
    texture: analysis.texture_description || 'Not detected',
    material: Array.isArray(analysis.materials) ? analysis.materials.join(', ') : 'Not detected',
    details: (() => {
        const parts: string[] = [];
        if (Array.isArray(analysis.design_elements)) parts.push(...analysis.design_elements);
        if (Array.isArray(analysis.style_keywords)) parts.push(...analysis.style_keywords);
        if (analysis.additional_details) parts.push(analysis.additional_details);
        return parts.join(', ') || 'No details detected';
    })(),
    logo_front: getLogoDesc(analysis.logo_front),
    logo_back: getLogoDesc(analysis.logo_back),
});

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Image files
    const [frontImage, setFrontImage] = useState<File | null>(null);
    const [backImage, setBackImage] = useState<File | null>(null);
    const [referenceImages, setReferenceImages] = useState<File[]>([]);

    // Analysis
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [productJSON, setProductJSON] = useState<ProductJSON | null>(null);
    const [productId, setProductId] = useState<string | null>(null);
    const [fullAnalysisResponse, setFullAnalysisResponse] = useState<any>(null);

    const isAnalyzed = !!productJSON;

    const resetProduct = useCallback(() => {
        setFrontImage(null);
        setBackImage(null);
        setReferenceImages([]);
        setIsAnalyzing(false);
        setProductJSON(null);
        setProductId(null);
        setFullAnalysisResponse(null);
    }, []);

    // Catalog product selection — no File objects, images are already on server
    const handleProductSelect = useCallback((product: Product) => {
        console.log('📦 [ProductContext] Product selected from catalog:', product.name, product.id);

        setProductId(product.id);
        setFrontImage(null);
        setBackImage(null);
        setReferenceImages([]);

        const analysis = product.analyzed_product_json as any;
        if (analysis) {
            setProductJSON(mapAnalysisToProductJSON(analysis, product.name));
            setFullAnalysisResponse({
                product_id: product.id,
                name: product.name,
                category: product.category,
                analysis,
                imageUrl: product.front_image_url || '',
                front_image_url: product.front_image_url,
                back_image_url: product.back_image_url,
                reference_images: product.reference_images || [],
            });
        }
    }, []);

    // Analyze product using uploaded files
    const handleAnalyze = useCallback(async (forceReanalyze = false) => {
        if (productJSON && !forceReanalyze) return;

        if (!frontImage || !backImage) {
            alert('Please upload both FRONT and BACK images.');
            return;
        }

        if (forceReanalyze) {
            setProductJSON(null);
            setFullAnalysisResponse(null);
            setProductId(null);
        }

        setIsAnalyzing(true);
        try {
            const { analyzeProductDirect } = await import('@/libs/server/HomePage/product');

            const response = await analyzeProductDirect(
                frontImage ? [frontImage] : [],
                backImage ? [backImage] : [],
                referenceImages,
                undefined,
            );

            console.log('✅ [ProductContext] Product analyzed:', response);

            setProductJSON(mapAnalysisToProductJSON(response.analysis, response.name));
            setProductId(response.product_id);
            setFullAnalysisResponse(response);
        } catch (error) {
            console.error('[ProductContext] Analysis failed:', error);
            alert('Product analysis failed. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    }, [frontImage, backImage, referenceImages, productJSON]);

    return (
        <ProductContext.Provider
            value={{
                frontImage, backImage, referenceImages,
                setFrontImage, setBackImage, setReferenceImages,
                isAnalyzing, setIsAnalyzing,
                productJSON, setProductJSON,
                productId, setProductId,
                fullAnalysisResponse, setFullAnalysisResponse,
                isAnalyzed,
                handleProductSelect,
                handleAnalyze,
                resetProduct,
            }}
        >
            {children}
        </ProductContext.Provider>
    );
};

export default ProductContext;
