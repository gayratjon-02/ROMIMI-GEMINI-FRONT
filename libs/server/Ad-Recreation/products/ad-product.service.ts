// libs/server/Ad-Recreation/products/ad-product.service.ts
// Single-image product analysis for Ad Recreation
import axiosClient from '@/libs/server/axios-client';

export interface AdProductAnalysisResult {
    product_id: string;
    image_url: string;
    analysis: Record<string, any>;
}

export interface AdProductListItem {
    id: string;
    name: string;
    front_image_url: string | null;
    back_image_url: string | null;
    analyzed_product_json: Record<string, any> | null;
    created_at: string;
}

/**
 * Fetches all previously analyzed products for the current user.
 * Endpoint: GET /api/ad-recreation/products
 */
export async function getAdProducts(): Promise<AdProductListItem[]> {
    const response = await axiosClient.get<{ success: boolean; products: AdProductListItem[] }>(
        '/api/ad-recreation/products',
    );
    return response.data.products || [];
}

/**
 * Updates the analyzed_product_json for an existing ad product.
 * Endpoint: PATCH /api/ad-recreation/products/:id
 */
export async function updateAdProductAnalysis(productId: string, analysis: object): Promise<void> {
    await axiosClient.patch(`/api/ad-recreation/products/${productId}`, {
        analyzed_product_json: analysis,
    });
}

/**
 * Deletes an analyzed product by ID.
 * Endpoint: DELETE /api/ad-recreation/products/:id
 */
export async function deleteAdProduct(productId: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.delete<{ success: boolean; message: string }>(
        `/api/ad-recreation/products/${productId}`,
    );
    return response.data;
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
