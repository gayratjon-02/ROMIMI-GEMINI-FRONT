// libs/server/Ad-Recreation/generation/generation.service.ts
// Generation Service - Triggers ad variation generation
import axiosClient from '@/libs/server/axios-client';

// ============================================
// TYPES - Matches Backend GenerateAdDto
// ============================================

/**
 * Backend DTO Structure (from generate-ad.dto.ts):
 * - brand_id: UUID (required)
 * - concept_id: UUID (required)
 * - marketing_angle_id: string (required) - e.g., "social_proof"
 * - format_id: string (required) - e.g., "story"
 * - product_input: string (required, max 2000 chars)
 */
export interface GenerationPayload {
    brand_id: string;           // UUID
    concept_id: string;         // UUID
    marketing_angle_id: string; // e.g., "problem_solution", "social_proof"
    format_id: string;          // e.g., "story", "square", "portrait"
    product_input: string;      // max 2000 characters
}

export interface AdCopyResult {
    headline: string;
    subheadline: string;
    cta: string;
    image_prompt: string;
}

export interface GenerationResult {
    id: string;
    status: string;
    brand_id?: string;
    concept_id?: string;
    marketing_angle_id?: string;
    format_id?: string;
    product_input?: string;
    ad_copy?: AdCopyResult;
    image_url?: string;
    created_at?: string;
}

export interface GenerationResponse {
    success: boolean;
    message: string;
    generation: GenerationResult;
    ad_copy?: AdCopyResult;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Triggers ad generation via POST /api/ad-generations/generate
 * 
 * The backend will:
 * 1. Fetch the brand and concept from DB
 * 2. Call Claude AI with the combined data
 * 3. Generate ad copy (headline, subheadline, cta, image_prompt)
 * 4. Save the generation to DB
 * 
 * @param payload - Generation configuration matching backend DTO
 * @returns Promise<GenerationResponse['generation']>
 * @throws Error if generation fails
 */
export async function generateAdVariations(payload: GenerationPayload): Promise<GenerationResult> {
    console.log('📤 Sending generation request:', payload);

    try {
        const response = await axiosClient.post<GenerationResponse>(
            '/api/ad-generations/generate',
            payload
        );

        console.log('✅ Generation created:', response.data.generation.id);
        console.log('📝 Ad Copy:', response.data.ad_copy);

        return response.data.generation;
    } catch (error: any) {
        // ============================================
        // ENHANCED ERROR LOGGING
        // ============================================
        console.error('❌ Generation API Error:');
        console.error('Status:', error.response?.status);
        console.error('Validation errors:', error.response?.data?.message);
        console.error('Full response:', error.response?.data);

        // Format error message
        const errorMessage = Array.isArray(error.response?.data?.message)
            ? error.response.data.message.join(', ')
            : error.response?.data?.message || error.message || 'Generation failed';

        throw new Error(errorMessage);
    }
}

/**
 * Renders the ad image via POST /api/ad-generations/:id/render
 * 
 * Uses the image_prompt from the generation to create the final image.
 * 
 * @param generationId - The generation ID to render
 * @returns Promise<GenerationResult>
 */
export async function renderAdImage(generationId: string): Promise<GenerationResult> {
    console.log('🖼️ Rendering image for generation:', generationId);

    try {
        const response = await axiosClient.post<{
            success: boolean;
            message: string;
            generation: GenerationResult;
        }>(`/api/ad-generations/${generationId}/render`);

        console.log('✅ Image rendered:', response.data.generation.image_url);
        return response.data.generation;
    } catch (error: any) {
        console.error('❌ Render API Error:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Image rendering failed');
    }
}

/**
 * Gets the status of a generation.
 * @param generationId - The generation ID
 * @returns Promise<GenerationResult>
 */
export async function getGenerationStatus(generationId: string): Promise<GenerationResult> {
    const response = await axiosClient.get<{ success: boolean; generation: GenerationResult }>(
        `/api/ad-generations/${generationId}`
    );

    return response.data.generation;
}

/**
 * Gets all generations for the current user.
 * @returns Promise<GenerationResult[]>
 */
export async function getAllGenerations(): Promise<GenerationResult[]> {
    const response = await axiosClient.get<{ success: boolean; generations: GenerationResult[] }>(
        '/api/ad-generations'
    );

    return response.data.generations;
}
