import {
    API_URL_NEXT,
    AuthApiError,
    Messages,
} from "@/libs/components/types/config";
import { getAuthToken } from "./signup";

// API Configuration
const API_URL = API_URL_NEXT;
const API_BASE = `${API_URL}/api`;

// Types for Settings
export interface UserSettings {
    id: string;
    email: string;
    name: string | null;
    brand_brief: string | null;
    api_key_openai: string | null;
    api_key_anthropic: string | null;
    api_key_gemini: string | null;
    language: string | null;
    theme: string | null;
    notifications_enabled: boolean;
}

export interface UpdateSettingsData {
    email?: string;
    name?: string;
    brand_brief?: string;
    api_key_openai?: string;
    api_key_anthropic?: string;
    api_key_gemini?: string;
    language?: string;
    theme?: string;
    notifications_enabled?: boolean;
}

export interface UpdateApiKeyData {
    keyType: 'openai' | 'anthropic' | 'gemini';
    apiKey: string | null;
}

function getAuthHeaders(): HeadersInit {
    const token = getAuthToken();
    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}

/**
 * Get user settings
 */
export async function getSettings(): Promise<UserSettings> {
    try {
        const response = await fetch(`${API_BASE}/users/getSettings`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to fetch settings"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as UserSettings;
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
 * Update user settings
 */
export async function updateSettings(data: UpdateSettingsData): Promise<UserSettings> {
    try {
        const response = await fetch(`${API_BASE}/users/updateSettings`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to update settings"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as UserSettings;
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
 * Update specific API key
 */
export async function updateApiKey(data: UpdateApiKeyData): Promise<{ success: boolean; message: string }> {
    try {
        const response = await fetch(`${API_BASE}/users/updateApiKey`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to update API key"];

            throw new AuthApiError(response.status, errorMessages, responseData);
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
