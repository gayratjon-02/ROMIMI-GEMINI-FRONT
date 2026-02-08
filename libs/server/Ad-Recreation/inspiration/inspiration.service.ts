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
    original_image_url?: string;
}

export interface AdConceptResponse {
    success: boolean;
    message?: string;
    concept: AdConceptAnalysis;
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

    const response = await axiosClient.post<AdConceptResponse>('/api/ad-concepts/analyze', formData);
    const data = response.data;

    // Debug log
    console.log('UPLOAD RESPONSE:', JSON.stringify(data, null, 2));

    // Backend returns: { success, message, concept: { id, analysis_json, image_url } }
    if (!data.concept || !data.concept.id) {
        console.error('Invalid API response - missing concept:', data);
        throw new Error('Invalid API response structure - missing concept');
    }

    return {
        conceptId: data.concept.id,
        analysisJson: data.concept.analysis_json,
        imageUrl: data.concept.image_url || data.concept.original_image_url || '',
    };
}

/**
 * Fetches a previously analyzed concept by ID.
 * @param conceptId - The concept ID to fetch
 * @returns Promise<AdConceptAnalysis | null>
 */
export async function fetchConceptById(conceptId: string): Promise<AdConceptAnalysis | null> {
    try {
        const response = await axiosClient.get<{ concept: AdConceptAnalysis }>(`/api/ad-concepts/${conceptId}`);
        return response.data.concept || null;
    } catch (error) {
        console.error(`Error fetching concept ${conceptId}:`, error);
        return null;
    }
}
