// libs/server/Ad-Recreation/products/ad-product.service.ts
// Single-image product analysis for Ad Recreation
import axiosClient from '@/libs/server/axios-client';

export interface AdProductAnalysisResult {
    product_id: string;
    image_url: string;
    analysis: Record<string, any>;
}

/**
 * Uploads a single reference product image and analyzes it with Claude.
 * Returns the product_id to use in generation.
 *
 * Endpoint: POST /api/ad-recreation/products/analyze
 * Field name: reference_image
 */
export async function analyzeAdProduct(file: File): Promise<AdProductAnalysisResult> {
    const formData = new FormData();
    formData.append('reference_image', file);

    const response = await axiosClient.post<{
        success: boolean;
        message: string;
        product_id: string;
        image_url: string;
        analysis: Record<string, any>;
    }>('/api/ad-recreation/products/analyze', formData);

    const data = response.data;

    if (!data.product_id) {
        throw new Error('Invalid API response — missing product_id');
    }

    return {
        product_id: data.product_id,
        image_url: data.image_url,
        analysis: data.analysis,
    };
}
