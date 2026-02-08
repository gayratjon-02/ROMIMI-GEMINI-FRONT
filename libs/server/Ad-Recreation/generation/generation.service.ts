// libs/server/Ad-Recreation/generation/generation.service.ts
// Generation Service - Triggers ad variation generation
import axiosClient from '@/libs/server/axios-client';

// ============================================
// TYPES (Frontend-facing, can use snake_case for convenience)
// ============================================

export interface GenerationPayload {
    brand_id: string;
    concept_id: string;
    product_description: string;
    marketing_angle: string; // e.g., "social_proof", "problem_solution"
    aspect_ratio: string;    // e.g., "9:16", "1:1"
}

export interface GenerationResult {
    id: string;
    status: string;
    variations?: any[];
}

export interface GenerationResponse {
    success: boolean;
    message: string;
    generation: GenerationResult;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Triggers ad variation generation.
 * Transforms payload to match backend DTO (camelCase).
 * 
 * @param payload - Generation configuration (snake_case from UI)
 * @returns Promise<GenerationResult>
 * @throws Error if generation fails
 */
export async function generateAdVariations(payload: GenerationPayload): Promise<GenerationResult> {
    console.log('📤 Generating ad variations with payload:', payload);

    // ============================================
    // TRANSFORM: snake_case → camelCase for Backend DTO
    // Backend expects: brandId, conceptId, productDescription, marketingAngle, aspectRatio
    // ============================================
    const backendPayload = {
        brandId: payload.brand_id,
        conceptId: payload.concept_id,
        productDescription: payload.product_description,
        marketingAngle: payload.marketing_angle,
        aspectRatio: payload.aspect_ratio,
    };

    console.log('📦 Backend payload (camelCase):', backendPayload);

    try {
        const response = await axiosClient.post<GenerationResponse>(
            '/api/ad-generations/generate',
            backendPayload
        );

        if (!response.data.success) {
            throw new Error(response.data.message || 'Generation failed');
        }

        console.log('✅ Generation started:', response.data.generation.id);
        return response.data.generation;
    } catch (error: any) {
        // ============================================
        // ENHANCED ERROR LOGGING
        // Show exact validation errors from NestJS
        // ============================================
        console.error('❌ Generation API Error:');
        console.error('Status:', error.response?.status);
        console.error('Message:', error.response?.data?.message);
        console.error('Full error data:', error.response?.data);

        // Re-throw with detailed message
        const errorMessage = Array.isArray(error.response?.data?.message)
            ? error.response.data.message.join(', ')
            : error.response?.data?.message || error.message || 'Generation failed';

        throw new Error(errorMessage);
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
