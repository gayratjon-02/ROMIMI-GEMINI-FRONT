import {
    API_URL_NEXT,
    AuthApiError,
    Messages,
} from "@/libs/components/types/config";
import { getAuthToken } from "./signup";
import { Brand, CreateBrandData, UpdateBrandData } from "@/libs/types/homepage/brand";

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

export async function getAllBrands(): Promise<Brand[]> {
    try {
        const response = await fetch(`${API_BASE}/brands/getAllBrands`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to fetch brands"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as Brand[];
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

export async function getBrand(id: string): Promise<Brand> {
    try {
        const response = await fetch(`${API_BASE}/brands/getBrand/${id}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to fetch brand"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as Brand;
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

export async function createBrand(data: CreateBrandData): Promise<Brand> {
    try {
        const response = await fetch(`${API_BASE}/brands/createBrand`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to create brand"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as Brand;
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

export async function updateBrand(
    id: string,
    data: UpdateBrandData
): Promise<Brand> {
    try {
        const response = await fetch(`${API_BASE}/brands/updateBrand/${id}`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to update brand"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as Brand;
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

export async function uploadModelReference(
    brandId: string,
    type: 'adult' | 'kid',
    file: File
): Promise<Brand> {
    try {
        const token = getAuthToken();
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
            `${API_BASE}/brands/${brandId}/model-reference?type=${type}`,
            {
                method: "POST",
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
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

        return responseData as Brand;
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

export async function deleteBrand(id: string): Promise<{ message: string }> {
    try {
        const response = await fetch(`${API_BASE}/brands/deleteBrand/${id}`, {
            method: "POST",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to delete brand"];

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
