// libs/server/Ad-Recreation/inspiration/inspiration.service.ts
// Service layer for Ad Recreation Inspiration Upload API
import axiosClient from '@/libs/server/axios-client';

export interface AdConceptAnalysis {
    id: string;
    analysis_json: {
        layout?: {
            headline?: { position: string; text?: string; style?: string };
            image?: { position: string; type?: string; description?: string };
            cta?: { position: string; text?: string; style?: string };
        };
        colors?: string[];
        mood?: string;
        style?: string;
        [key: string]: any;
    };
    image_url: string;
}

export interface AdConceptResponse {
    success: boolean;
    data?: AdConceptAnalysis;
    // Sometimes backend returns flat structure
    id?: string;
    analysis_json?: any;
    image_url?: string;
    original_image_url?: string;
    message?: string;
}

export interface UploadResult {
    conceptId: string;
    analysisJson: any;
    imageUrl: string;
}

/**
 * Uploads an inspiration image to the API for analysis.
 * @param file - The image file to upload
 * @returns Promise<UploadResult> - The concept ID and analysis results
 * @throws Error if upload fails
 */
export async function uploadInspirationImage(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file); // Backend FileInterceptor expects 'file'

    // Note: axios automatically sets Content-Type with boundary for FormData
    const response = await axiosClient.post<AdConceptResponse>('/api/ad-concepts/analyze', formData);

    // Debug: Log full response to understand structure
    console.log('UPLOAD RESPONSE:', JSON.stringify(response.data, null, 2));

    // Handle both nested (data.data) and flat (data) response structures
    const result = response.data.data || response.data;

    // Validate response structure
    if (!result || !result.id) {
        console.error('Invalid API response structure:', response.data);
        throw new Error('Invalid API response structure - missing id');
    }

    // Extract fields with fallbacks for different naming conventions
    const conceptId = result.id;
    const analysisJson = result.analysis_json || result.analysis || {};
    const imageUrl = result.image_url || result.original_image_url || result.url || '';

    console.log('Parsed concept:', { conceptId, analysisJson, imageUrl });

    return {
        conceptId,
        analysisJson,
        imageUrl,
    };
}

/**
 * Fetches a previously analyzed concept by ID.
 * @param conceptId - The concept ID to fetch
 * @returns Promise<AdConceptAnalysis | null>
 */
export async function fetchConceptById(conceptId: string): Promise<AdConceptAnalysis | null> {
    try {
        const response = await axiosClient.get<{ data?: AdConceptAnalysis } & AdConceptAnalysis>(`/api/ad-concepts/${conceptId}`);

        // Handle both nested and flat response
        const result = response.data.data || response.data;
        return result || null;
    } catch (error) {
        console.error(`Error fetching concept ${conceptId}:`, error);
        return null;
    }
}
