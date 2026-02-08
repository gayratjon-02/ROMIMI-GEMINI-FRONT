// libs/server/Ad-Recreation/generation/generation.service.ts
// Generation Service - Triggers ad variation generation
import axiosClient from '@/libs/server/axios-client';

// ============================================
// TYPES
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
 * @param payload - Generation configuration
 * @returns Promise<GenerationResult>
 * @throws Error if generation fails
 */
export async function generateAdVariations(payload: GenerationPayload): Promise<GenerationResult> {
    console.log('Generating ad variations with payload:', payload);

    const response = await axiosClient.post<GenerationResponse>(
        '/api/ad-generations/generate',
        payload
    );

    if (!response.data.success) {
        throw new Error(response.data.message || 'Generation failed');
    }

    console.log('Generation started:', response.data.generation.id);
    return response.data.generation;
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
