/**
 * Generate API - Image generation specific functions
 * 
 * Note: These functions re-export and wrap the generation APIs from merging.ts
 * for better code organization. Core generation logic is in generations controller.
 */

import {
    API_URL_NEXT,
    AuthApiError,
    Messages,
} from "@/libs/components/types/config";
import { getAuthToken } from "./signup";
import {
    Generation,
    GenerateData,
    GenerationProgressResponse,
    VisualOutput,
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
 * Start image generation process
 * POST /api/generations/:id/generate
 */
export async function startGeneration(id: string, data?: GenerateData): Promise<Generation> {
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
 * Get generation progress with visual outputs
 * GET /api/generations/getProgress/:id
 */
export async function getGenerationProgress(id: string): Promise<GenerationProgressResponse> {
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
 * Retry a failed visual generation
 * POST /api/generations/:generationId/visual/:index/retry
 */
export async function retryFailedVisual(
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
 * Download all generated images as ZIP
 * GET /api/generations/download/:id
 */
export async function downloadGeneratedImages(id: string): Promise<Blob> {
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
 * Reset a generation to start over
 * POST /api/generations/reset/:id
 */
export async function resetGenerationStatus(id: string): Promise<Generation> {
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
 * Poll generation progress (for UI polling)
 * Returns simplified progress info
 */
export async function pollGenerationStatus(id: string): Promise<{
    status: string;
    progress: number;
    completedCount: number;
    totalCount: number;
    visuals: VisualOutput[];
    isComplete: boolean;
    hasFailed: boolean;
}> {
    const progress = await getGenerationProgress(id);

    const completedVisuals = progress.visual_outputs.filter(v => v.status === 'completed').length;
    const failedVisuals = progress.visual_outputs.filter(v => v.status === 'failed').length;

    return {
        status: progress.status,
        progress: progress.progress_percentage,
        completedCount: completedVisuals,
        totalCount: progress.total_visuals,
        visuals: progress.visual_outputs,
        isComplete: progress.status === 'completed',
        hasFailed: failedVisuals > 0,
    };
}

/**
 * Helper: Trigger download of generated ZIP file
 */
export async function triggerDownload(id: string, filename?: string): Promise<void> {
    const blob = await downloadGeneratedImages(id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `generation-${id}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

/**
 * Debug: Test generation config
 * GET /api/generations/debug/config
 */
export async function testGenerationConfig(): Promise<{
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
