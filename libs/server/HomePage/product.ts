import {
    API_URL_NEXT,
    AuthApiError,
    Messages,
} from "@/libs/components/types/config";
import { getAuthToken } from "./signup";
import {
    Product,
    CreateProductData,
    UpdateProductData,
    AnalyzeImagesData,
    UpdateProductJsonData,
    ProductsListResponse,
    AnalyzeProductResponse,
    UpdateProductJsonResponse,
    AnalyzeImagesResponse,
} from "@/libs/types/homepage/product";

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

function getAuthHeadersForFormData(): HeadersInit {
    const token = getAuthToken();
    return {
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}

/**
 * Create a new product with images (multipart form data)
 */
export async function createProduct(
    name: string,
    collectionId: string,
    frontImage?: File,
    backImage?: File,
    referenceImages?: File[]
): Promise<Product> {
    try {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("collection_id", collectionId);

        if (frontImage) {
            formData.append("front_image", frontImage);
        }
        if (backImage) {
            formData.append("back_image", backImage);
        }
        if (referenceImages && referenceImages.length > 0) {
            referenceImages.forEach((img) => {
                formData.append("reference_images", img);
            });
        }

        const response = await fetch(`${API_BASE}/products`, {
            method: "POST",
            headers: getAuthHeadersForFormData(),
            body: formData,
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to create product"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as Product;
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
 * Get all products with optional filters
 */
export async function getAllProducts(
    collectionId?: string,
    page?: number,
    limit?: number
): Promise<ProductsListResponse> {
    try {
        const params = new URLSearchParams();
        if (collectionId) params.append("collection_id", collectionId);
        if (page) params.append("page", page.toString());
        if (limit) params.append("limit", limit.toString());

        const queryString = params.toString() ? `?${params.toString()}` : "";

        const response = await fetch(`${API_BASE}/products/getAllProducts${queryString}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to fetch products"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as ProductsListResponse;
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
 * Get a single product by ID
 */
export async function getProduct(id: string): Promise<Product> {
    try {
        const response = await fetch(`${API_BASE}/products/getProduct/${id}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to fetch product"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as Product;
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
 * Update a product
 */
export async function updateProduct(
    id: string,
    data: UpdateProductData
): Promise<Product> {
    try {
        const response = await fetch(`${API_BASE}/products/updateProduct/${id}`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to update product"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as Product;
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
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<{ message: string }> {
    try {
        const response = await fetch(`${API_BASE}/products/deleteProduct/${id}`, {
            method: "POST",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to delete product"];

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
 * Analyze images (standalone analysis without product)
 */
export async function analyzeImages(
    data: AnalyzeImagesData
): Promise<AnalyzeImagesResponse> {
    try {
        const response = await fetch(`${API_BASE}/products/analyze-images`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to analyze images"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as AnalyzeImagesResponse;
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
 * STEP 1: Analyze Product (AI analysis)
 */
export async function analyzeProduct(id: string): Promise<AnalyzeProductResponse> {
    try {
        const response = await fetch(`${API_BASE}/products/${id}/analyze`, {
            method: "POST",
            headers: getAuthHeaders(),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to analyze product"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as AnalyzeProductResponse;
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
 * STEP 2: Update Product JSON (User edits/overrides)
 */
export async function updateProductJson(
    id: string,
    data: UpdateProductJsonData
): Promise<UpdateProductJsonResponse> {
    try {
        const response = await fetch(`${API_BASE}/products/updateProductJson/${id}`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessages = Array.isArray(responseData.message)
                ? responseData.message
                : [responseData.message || "Failed to update product JSON"];

            throw new AuthApiError(response.status, errorMessages, responseData);
        }

        return responseData as UpdateProductJsonResponse;
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
