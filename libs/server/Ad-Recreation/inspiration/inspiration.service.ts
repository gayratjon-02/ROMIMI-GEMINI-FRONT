// libs/server/Ad-Recreation/inspiration/inspiration.service.ts
// Service layer for Ad Recreation Inspiration Upload API

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

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
    try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE_URL}/api/ad-concepts/analyze`, {
            method: 'POST',
            body: formData,
            credentials: 'include', // Include cookies for auth if needed
            // Note: Don't set Content-Type header - browser will set it with boundary for FormData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Upload failed: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        const data: AdConceptResponse = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Analysis failed');
        }

        return {
            conceptId: data.data.id,
            analysisJson: data.data.analysis_json,
            imageUrl: data.data.image_url,
        };
    } catch (error) {
        console.error('Error uploading inspiration image:', error);
        throw error;
    }
}

/**
 * Fetches a previously analyzed concept by ID.
 * @param conceptId - The concept ID to fetch
 * @returns Promise<AdConceptAnalysis | null>
 */
export async function fetchConceptById(conceptId: string): Promise<AdConceptAnalysis | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/ad-concepts/${conceptId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            console.error(`Failed to fetch concept ${conceptId}: ${response.status}`);
            return null;
        }

        const data = await response.json();
        return data.data || null;
    } catch (error) {
        console.error(`Error fetching concept ${conceptId}:`, error);
        return null;
    }
}
