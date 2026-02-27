import {
    API_URL_NEXT,
    AuthApiError,
    Messages,
} from "@/libs/components/types/config";
import { getAuthToken } from "./signup";
import {
    Generation,
    CreateGenerationData,
    GenerateData,
    MergePromptsData,
    UpdateMergedPromptsData,
    GenerationsListResponse,
    MergePromptsResponse,
    UpdatePromptsResponse,
    GetPromptsResponse,
    GenerationProgressResponse,
} from "@/libs/types/homepage/generation";

// API Configuration
const API_URL = API_URL_NEXT;
const API_BASE = `${API_URL}/api`;

function getAuthHeaders(): HeadersInit {
    const token = getAuthToken();
    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}

/**
 * Create a new generation
 */
export async function createGeneration(data: CreateGenerationData): Promise<Generation> {
    try {
        const response = await fetch(`${API_BASE}/generations/createGeneration`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to create generation"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as Generation;
    } catch (error) {
        if (error instanceof AuthApiError) {
            throw error;
        }

        throw new AuthApiError(500, [Messages.CONNECTION_ERROR], {
            statusCode: 500,
            message: Messages.NETWORK_ERROR,
            error: Messages.INTERNAL_SERVER_ERROR,
        });
    }
}

/**
 * Get all generations with optional filters
 */
export async function getAllGenerations(
    productId?: string,
    collectionId?: string,
    generationType?: string,
    status?: string,
    page?: number,
    limit?: number
): Promise<GenerationsListResponse> {
    try {
        const params = new URLSearchParams();
        if (productId) params.append("product_id", productId);
        if (collectionId) params.append("collection_id", collectionId);
        if (generationType) params.append("generation_type", generationType);
        if (status) params.append("status", status);
        if (page) params.append("page", page.toString());
        if (limit) params.append("limit", limit.toString());

        const queryString = params.toString() ? `?${params.toString()}` : "";

        const response = await fetch(`${API_BASE}/generations/getAllGenerations${queryString}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to fetch generations"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as GenerationsListResponse;
    } catch (error) {
        if (error instanceof AuthApiError) {
            throw error;
        }

        throw new AuthApiError(500, [Messages.CONNECTION_ERROR], {
            statusCode: 500,
            message: Messages.NETWORK_ERROR,
            error: Messages.INTERNAL_SERVER_ERROR,
        });
    }
}

/**
 * Get a single generation with details
 */
export async function getGeneration(id: string): Promise<Generation> {
    try {
        const response = await fetch(`${API_BASE}/generations/getGeneration/${id}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to fetch generation"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as Generation;
    } catch (error) {
        if (error instanceof AuthApiError) {
            throw error;
        }

        throw new AuthApiError(500, [Messages.CONNECTION_ERROR], {
            statusCode: 500,
            message: Messages.NETWORK_ERROR,
            error: Messages.INTERNAL_SERVER_ERROR,
        });
    }
}

/**
 * STEP 3: Merge Product + DA prompts
 */
export async function mergePrompts(
    id: string,
    data?: MergePromptsData
): Promise<MergePromptsResponse> {
    try {
        const response = await fetch(`${API_BASE}/generations/${id}/merge`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data || {}),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to merge prompts"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as MergePromptsResponse;
    } catch (error) {
        if (error instanceof AuthApiError) {
            throw error;
        }

        throw new AuthApiError(500, [Messages.CONNECTION_ERROR], {
            statusCode: 500,
            message: Messages.NETWORK_ERROR,
            error: Messages.INTERNAL_SERVER_ERROR,
        });
    }
}

/**
 * STEP 6: Update merged prompts (user edits)
 */
export async function updateMergedPrompts(
    id: string,
    data: UpdateMergedPromptsData
): Promise<UpdatePromptsResponse> {
    try {
        const response = await fetch(`${API_BASE}/generations/updateMergedPrompts/${id}`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to update prompts"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as UpdatePromptsResponse;
    } catch (error) {
        if (error instanceof AuthApiError) {
            throw error;
        }

        throw new AuthApiError(500, [Messages.CONNECTION_ERROR], {
            statusCode: 500,
            message: Messages.NETWORK_ERROR,
            error: Messages.INTERNAL_SERVER_ERROR,
        });
    }
}

/**
 * Get prompts for preview (before generation)
 */
export async function getPrompts(id: string): Promise<GetPromptsResponse> {
    try {
        const response = await fetch(`${API_BASE}/generations/getPrompts/${id}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to get prompts"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as GetPromptsResponse;
    } catch (error) {
        if (error instanceof AuthApiError) {
            throw error;
        }

        throw new AuthApiError(500, [Messages.CONNECTION_ERROR], {
            statusCode: 500,
            message: Messages.NETWORK_ERROR,
            error: Messages.INTERNAL_SERVER_ERROR,
        });
    }
}

/**
 * Start image generation
 */
export async function generate(id: string, data?: GenerateData): Promise<Generation> {
    try {
        const response = await fetch(`${API_BASE}/generations/${id}/generate`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data || {}),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to start generation"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as Generation;
    } catch (error) {
        if (error instanceof AuthApiError) {
            throw error;
        }

        throw new AuthApiError(500, [Messages.CONNECTION_ERROR], {
            statusCode: 500,
            message: Messages.NETWORK_ERROR,
            error: Messages.INTERNAL_SERVER_ERROR,
        });
    }
}

/**
 * Reset a generation to start over
 */
export async function resetGeneration(id: string): Promise<Generation> {
    try {
        const response = await fetch(`${API_BASE}/generations/reset/${id}`, {
            method: "POST",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to reset generation"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as Generation;
    } catch (error) {
        if (error instanceof AuthApiError) {
            throw error;
        }

        throw new AuthApiError(500, [Messages.CONNECTION_ERROR], {
            statusCode: 500,
            message: Messages.NETWORK_ERROR,
            error: Messages.INTERNAL_SERVER_ERROR,
        });
    }
}

/**
 * Get generation progress
 */
export async function getProgress(id: string): Promise<GenerationProgressResponse> {
    try {
        const response = await fetch(`${API_BASE}/generations/getProgress/${id}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to get progress"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as GenerationProgressResponse;
    } catch (error) {
        if (error instanceof AuthApiError) {
            throw error;
        }

        throw new AuthApiError(500, [Messages.CONNECTION_ERROR], {
            statusCode: 500,
            message: Messages.NETWORK_ERROR,
            error: Messages.INTERNAL_SERVER_ERROR,
        });
    }
}

/**
 * Download generated images as ZIP
 */
export async function downloadGeneration(id: string): Promise<Blob> {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/generations/download/${id}`, {
            method: "GET",
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        });

        if (!response.ok) {
            const responseData = await response.json();
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to download"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return await response.blob();
    } catch (error) {
        if (error instanceof AuthApiError) {
            throw error;
        }

        throw new AuthApiError(500, [Messages.CONNECTION_ERROR], {
            statusCode: 500,
            message: Messages.NETWORK_ERROR,
            error: Messages.INTERNAL_SERVER_ERROR,
        });
    }
}

/**
 * Retry a failed visual
 */
export async function retryVisual(
    generationId: string,
    visualIndex: number,
    model?: string
): Promise<Generation> {
    try {
        const response = await fetch(`${API_BASE}/generations/${generationId}/visual/${visualIndex}/retry`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ model }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to retry visual"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as Generation;
    } catch (error) {
        if (error instanceof AuthApiError) {
            throw error;
        }

        throw new AuthApiError(500, [Messages.CONNECTION_ERROR], {
            statusCode: 500,
            message: Messages.NETWORK_ERROR,
            error: Messages.INTERNAL_SERVER_ERROR,
        });
    }
}

/**
 * Delete a generation
 */
export async function deleteGeneration(id: string): Promise<{ message: string }> {
    try {
        const response = await fetch(`${API_BASE}/generations/deleteGeneration/${id}`, {
            method: "POST",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to delete generation"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as { message: string };
    } catch (error) {
        if (error instanceof AuthApiError) {
            throw error;
        }

        throw new AuthApiError(500, [Messages.CONNECTION_ERROR], {
            statusCode: 500,
            message: Messages.NETWORK_ERROR,
            error: Messages.INTERNAL_SERVER_ERROR,
        });
    }
}

/**
 * Debug: Get config status
 */
export async function debugConfig(): Promise<{
    gemini_configured: boolean;
    model: string;
    redis_connected: boolean;
}> {
    try {
        const response = await fetch(`${API_BASE}/generations/debug/config`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new AuthApiError(response.status, ["Failed to get config"], responseData);
        }

        return responseData;
    } catch (error) {
        if (error instanceof AuthApiError) {
            throw error;
        }

        throw new AuthApiError(500, [Messages.CONNECTION_ERROR], {
            statusCode: 500,
            message: Messages.NETWORK_ERROR,
            error: Messages.INTERNAL_SERVER_ERROR,
        });
    }
}
