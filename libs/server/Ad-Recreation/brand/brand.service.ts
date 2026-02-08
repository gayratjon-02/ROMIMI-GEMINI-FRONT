// libs/server/Ad-Recreation/brand/brand.service.ts
// Service layer for Ad Recreation Brand API calls

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export interface AdBrand {
    id: string;
    name: string;
    logo_url?: string;
    website_url?: string;
    description?: string;
    primary_color?: string;
    secondary_color?: string;
    created_at?: string;
    updated_at?: string;
}

interface BrandResponse {
    success: boolean;
    brands: AdBrand[];
}

/**
 * Custom error class for authentication errors
 */
export class AuthError extends Error {
    constructor(message: string = 'User not authenticated') {
        super(message);
        this.name = 'AuthError';
    }
}

/**
 * Helper function to get authorization headers with Bearer token.
 * @returns Headers object with Authorization and Content-Type
 * @throws AuthError if no token found in localStorage
 */
function getAuthHeaders(): { Authorization: string; 'Content-Type': string } {
    if (typeof window === 'undefined') {
        throw new AuthError('Cannot access localStorage on server');
    }

    const token = localStorage.getItem('auth_token');

    if (!token) {
        throw new AuthError('User not authenticated');
    }

    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Fetches all ad brands from the backend API.
 * @returns Promise<AdBrand[]> - Array of brands or empty array on error
 * @throws AuthError if user is not authenticated
 */
export async function fetchAdBrands(): Promise<AdBrand[]> {
    const headers = getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/ad-brands`, {
        method: 'GET',
        headers,
        credentials: 'include',
    });

    if (response.status === 401) {
        throw new AuthError('Session expired. Please log in again.');
    }

    if (!response.ok) {
        console.error(`Failed to fetch brands: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch brands: ${response.status}`);
    }

    const data: BrandResponse = await response.json();

    if (!data.success) {
        console.error('API returned success: false');
        return [];
    }

    return data.brands || [];
}

/**
 * Fetches a single brand by ID.
 * @param brandId - The brand ID to fetch
 * @returns Promise<AdBrand | null> - The brand or null if not found
 * @throws AuthError if user is not authenticated
 */
export async function fetchAdBrandById(brandId: string): Promise<AdBrand | null> {
    const headers = getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/ad-brands/${brandId}`, {
        method: 'GET',
        headers,
        credentials: 'include',
    });

    if (response.status === 401) {
        throw new AuthError('Session expired. Please log in again.');
    }

    if (!response.ok) {
        console.error(`Failed to fetch brand ${brandId}: ${response.status}`);
        return null;
    }

    const data = await response.json();
    return data.brand || null;
}

/**
 * Interface for creating a new brand
 */
export interface CreateBrandData {
    name: string;
    website_url: string;
    description?: string;
}

/**
 * Creates a new brand.
 * @param data - Brand creation data
 * @returns Promise<AdBrand> - The created brand
 * @throws AuthError if user is not authenticated
 * @throws Error if creation fails
 */
export async function createBrand(data: CreateBrandData): Promise<AdBrand> {
    const headers = getAuthHeaders();

    // Transform data: map website_url -> website and inject P0 defaults
    // NOTE: Backend DTO does NOT accept 'description' - stripped out
    const payload = {
        name: data.name,
        website: data.website_url, // API expects 'website' not 'website_url'
        industry: 'General', // P0 default - skipable advanced field
    };

    const response = await fetch(`${API_BASE_URL}/api/ad-brands`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
    });

    if (response.status === 401) {
        throw new AuthError('Session expired. Please log in again.');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create brand: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || 'Failed to create brand');
    }

    return result.brand;
}
