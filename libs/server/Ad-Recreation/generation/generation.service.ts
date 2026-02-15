// libs/server/Ad-Recreation/generation/generation.service.ts
// Generation Service - Triggers ad variation generation
import axiosClient from '@/libs/server/axios-client';

// ============================================
// TYPES - Matches Backend GenerateAdDto
// ============================================

/**
 * Backend DTO Structure (from generate-ad.dto.ts):
 * - brand_id: UUID (required) - product data is auto-fetched from brand
 * - concept_id: UUID (required)
 * - marketing_angle_id: string (required) - e.g., "social_proof"
 * - format_id: string (required) - e.g., "story"
 */
export interface GenerationPayload {
    brand_id: string;           // UUID - product data auto-fetched on backend
    concept_id: string;         // UUID
    marketing_angle_id: string; // e.g., "problem_solution", "social_proof"
    format_id: string;          // e.g., "story", "square", "portrait"
    product_id?: string;        // Optional UUID - product images sent to Gemini as reference
}

export interface AdCopyResult {
    headline: string;
    subheadline: string;
    cta: string;
    image_prompt: string;
}

export interface ResultImage {
    id: string;
    url?: string;
    base64?: string;
    mimeType?: string;
    format: string;
    angle: string;
    variation_index: number;
    generated_at: string;
}

export interface GenerationResult {
    id: string;
    status: string;
    brand_id?: string;
    concept_id?: string;
    marketing_angle_id?: string;
    format_id?: string;
    generated_copy?: AdCopyResult;
    result_images?: ResultImage[];
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
 * Triggers ad generation via POST /api/ad-recreation/generate
 * 
 * The backend will:
 * 1. Fetch the brand and concept from DB
 * 2. Call Gemini AI for text generation (headline, subheadline, cta, image_prompt)
 * 3. Call Gemini AI for image generation
 * 4. Save the generation to DB with result_images
 * 
 * @param payload - Generation configuration matching backend DTO
 * @returns Promise<GenerationResult>
 * @throws Error if generation fails
 */
export async function generateAdVariations(payload: GenerationPayload): Promise<GenerationResult> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📤 SENDING GENERATION REQUEST');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await axiosClient.post<GenerationResponse>(
            '/api/ad-recreation/generate',
            payload
        );

        console.log('═══════════════════════════════════════════════════════════');
        console.log('📥 RECEIVED RESPONSE');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('Status:', response.status);
        console.log('Generation ID:', response.data.generation?.id);
        console.log('Generation Status:', response.data.generation?.status);
        console.log('Ad Copy:', JSON.stringify(response.data.ad_copy, null, 2));
        console.log('Result Images Count:', response.data.generation?.result_images?.length || 0);

        if (response.data.generation?.result_images?.length) {
            response.data.generation.result_images.forEach((img, idx) => {
                console.log(`  Image ${idx + 1}:`);
                console.log(`    - ID: ${img.id}`);
                console.log(`    - URL: ${img.url || 'N/A'}`);
                console.log(`    - Has Base64: ${img.base64 ? 'Yes (' + (img.base64.length / 1024).toFixed(1) + ' KB)' : 'No'}`);
            });
        }
        console.log('═══════════════════════════════════════════════════════════\n');

        return response.data.generation;
    } catch (error: any) {
        // ============================================
        // ENHANCED ERROR LOGGING
        // ============================================
        console.error('═══════════════════════════════════════════════════════════');
        console.error('❌ GENERATION API ERROR');
        console.error('═══════════════════════════════════════════════════════════');
        console.error('Status:', error.response?.status);
        console.error('Validation errors:', error.response?.data?.message);
        console.error('Full response:', JSON.stringify(error.response?.data, null, 2));
        console.error('═══════════════════════════════════════════════════════════\n');

        // Format error message
        const errorMessage = Array.isArray(error.response?.data?.message)
            ? error.response.data.message.join(', ')
            : error.response?.data?.message || error.message || 'Generation failed';

        throw new Error(errorMessage);
    }
}

/**
 * Renders the ad image via POST /api/ad-recreation/:id/render
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
        }>(`/api/ad-recreation/${generationId}/render`);

        console.log('✅ Image rendered:', response.data.generation.result_images?.[0]?.url);
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
        `/api/ad-recreation/${generationId}`
    );

    return response.data.generation;
}

/**
 * Regenerates a specific variation of a generation.
 * @param generationId - The generation ID
 * @param variationIndex - The variation index to regenerate (1-based)
 * @returns Promise<GenerationResult>
 */
export async function regenerateVariation(generationId: string, variationIndex: number): Promise<GenerationResult> {
    console.log(`🔄 Regenerating variation ${variationIndex} for generation: ${generationId}`);

    try {
        const response = await axiosClient.post<{
            success: boolean;
            message: string;
            generation: GenerationResult;
        }>(`/api/ad-recreation/${generationId}/regenerate`, {
            variation_index: variationIndex,
        });

        console.log('✅ Variation regenerated:', response.data.generation.result_images?.length, 'images');
        return response.data.generation;
    } catch (error: any) {
        console.error('❌ Regenerate API Error:', error.response?.data);
        throw new Error(error.response?.data?.message || 'Regeneration failed');
    }
}

/**
 * Gets all generations for the current user.
 * @returns Promise<GenerationResult[]>
 */
export async function getAllGenerations(): Promise<GenerationResult[]> {
    const response = await axiosClient.get<{ success: boolean; generations: GenerationResult[] }>(
        '/api/ad-recreation'
    );

    return response.data.generations;
}
