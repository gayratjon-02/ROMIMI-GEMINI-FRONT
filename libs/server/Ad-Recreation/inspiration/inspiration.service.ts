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
    data: AdConceptAnalysis;
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
    formData.append('file', file); // Backend FileInterceptor expects 'file', not 'image'

    // Note: axios automatically sets Content-Type with boundary for FormData
    const response = await axiosClient.post<AdConceptResponse>('/api/ad-concepts/analyze', formData);

    if (!response.data.success) {
        throw new Error(response.data.message || 'Analysis failed');
    }

    return {
        conceptId: response.data.data.id,
        analysisJson: response.data.data.analysis_json,
        imageUrl: response.data.data.image_url,
    };
}

/**
 * Fetches a previously analyzed concept by ID.
 * @param conceptId - The concept ID to fetch
 * @returns Promise<AdConceptAnalysis | null>
 */
export async function fetchConceptById(conceptId: string): Promise<AdConceptAnalysis | null> {
    try {
        const response = await axiosClient.get<{ data: AdConceptAnalysis }>(`/api/ad-concepts/${conceptId}`);
        return response.data.data || null;
    } catch (error) {
        console.error(`Error fetching concept ${conceptId}:`, error);
        return null;
    }
}
