import {
    API_URL_NEXT,
    AuthApiError,
    Messages,
} from "@/libs/components/types/config";
import { getAuthToken } from "./signup";
import { Collection, CreateCollectionData, UpdateCollectionData } from "@/libs/types/homepage/collection";

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
 * Get all collections for the current user
 */
export async function getAllCollections(): Promise<Collection[]> {
    try {
        const response = await fetch(`${API_BASE}/collections/getAllCollections`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to fetch collections"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as Collection[];
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
 * Get all collections for a specific brand
 */
export async function getCollectionsByBrand(brandId: string): Promise<Collection[]> {
    try {
        const response = await fetch(`${API_BASE}/collections/getCollectionsByBrand/${brandId}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to fetch collections"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as Collection[];
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
 * Get a single collection by ID
 */
export async function getCollection(id: string): Promise<Collection> {
    try {
        const response = await fetch(`${API_BASE}/collections/getCollection/${id}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to fetch collection"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as Collection;
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
 * Create a new collection
 */
export async function createCollection(data: CreateCollectionData): Promise<Collection> {
    try {
        const response = await fetch(`${API_BASE}/collections/createCollection`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to create collection"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as Collection;
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
 * Update an existing collection
 */
export async function updateCollection(
    id: string,
    data: UpdateCollectionData
): Promise<Collection> {
    try {
        const response = await fetch(`${API_BASE}/collections/updateCollection/${id}`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to update collection"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as Collection;
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
 * Delete a collection
 */
export async function deleteCollection(id: string): Promise<{ message: string }> {
    try {
        const response = await fetch(`${API_BASE}/collections/deleteCollection/${id}`, {
            method: "POST",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to delete collection"];

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
