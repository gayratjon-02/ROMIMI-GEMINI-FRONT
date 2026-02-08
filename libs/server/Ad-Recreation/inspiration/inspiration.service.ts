// libs/server/Ad-Recreation/inspiration/inspiration.service.ts
// Service layer for Ad Recreation Inspiration Upload API
import axiosClient from '@/libs/server/axios-client';

export interface ConceptZone {
    id: string;
    y_start: number;
    y_end: number;
    content_type: 'headline' | 'body' | 'cta_button' | 'image' | 'logo' | 'ui_element';
    typography_style: string;
    description: string;
}

export interface VisualBackground {
    type: 'solid_color' | 'image' | 'gradient';
    hex: string | null;
}

export interface ContentPattern {
    hook_type: string;
    narrative_structure: string;
    cta_style: string;
    requires_product_image: boolean;
}

export interface AnalysisJson {
    layout: {
        type: string;
        format: string;
        zones: ConceptZone[];
    };
    visual_style: {
        mood: string;
        background: VisualBackground;
        overlay: string;
    };
    content_pattern: ContentPattern;
    [key: string]: any;
}

export interface AdConceptAnalysis {
    id: string;
    analysis_json: AnalysisJson;
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
    analysisJson: AnalysisJson;
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

/**
 * Updates the analysis JSON for an existing concept.
 * @param conceptId - The concept ID to update
 * @param analysisJson - The new analysis JSON object
 * @returns Promise<AdConceptAnalysis>
 * @throws Error if update fails
 */
export async function updateConceptAnalysis(conceptId: string, analysisJson: object): Promise<AdConceptAnalysis> {
    const response = await axiosClient.patch<{ success: boolean; message: string; concept: AdConceptAnalysis }>(
        `/api/ad-concepts/${conceptId}`,
        { analysis_json: analysisJson }
    );

    if (!response.data.success) {
        throw new Error(response.data.message || 'Update failed');
    }

    console.log('Concept updated:', response.data.concept.id);
    return response.data.concept;
}
