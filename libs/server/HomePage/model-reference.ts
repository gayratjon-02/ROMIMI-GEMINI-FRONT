import {
    API_URL_NEXT,
    AuthApiError,
    Messages,
} from "@/libs/components/types/config";
import { getAuthToken } from "./signup";
import { ModelReference } from "@/libs/types/homepage/model-reference";

const API_URL = API_URL_NEXT;
const API_BASE = `${API_URL}/api`;

function getAuthHeaders(): HeadersInit {
    const token = getAuthToken();
    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}

function getAuthHeadersForFormData(): HeadersInit {
    const token = getAuthToken();
    return {
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}

export async function getModelReferences(brandId: string): Promise<ModelReference[]> {
    try {
        const response = await fetch(
            `${API_BASE}/model-references?brand_id=${brandId}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to fetch model references"];
            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData.data as ModelReference[];
    } catch (error) {
        if (error instanceof AuthApiError) throw error;
        throw new AuthApiError(500, [Messages.CONNECTION_ERROR], {
            statusCode: 500,
            message: Messages.NETWORK_ERROR,
            error: Messages.INTERNAL_SERVER_ERROR,
        });
    }
}

export async function uploadModelReference(
    brandId: string,
    name: string,
    type: 'adult' | 'kid',
    file: File
): Promise<ModelReference> {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('brand_id', brandId);
        formData.append('name', name);
        formData.append('type', type);

        const response = await fetch(
            `${API_BASE}/model-references/upload`,
            {
                method: "POST",
                headers: getAuthHeadersForFormData(),
                body: formData,
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to upload model reference"];
            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData.data as ModelReference;
    } catch (error) {
        if (error instanceof AuthApiError) throw error;
        throw new AuthApiError(500, [Messages.CONNECTION_ERROR], {
            statusCode: 500,
            message: Messages.NETWORK_ERROR,
            error: Messages.INTERNAL_SERVER_ERROR,
        });
    }
}

export async function deleteModelReference(id: string): Promise<{ message: string }> {
    try {
        const response = await fetch(
            `${API_BASE}/model-references/delete/${id}`,
            {
                method: "POST",
                headers: getAuthHeaders(),
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to delete model reference"];
            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as { message: string };
    } catch (error) {
        if (error instanceof AuthApiError) throw error;
        throw new AuthApiError(500, [Messages.CONNECTION_ERROR], {
            statusCode: 500,
            message: Messages.NETWORK_ERROR,
            error: Messages.INTERNAL_SERVER_ERROR,
        });
    }
}
