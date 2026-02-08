// libs/server/Ad-Recreation/brand/brand.service.ts
// Service layer for Ad Recreation Brand API calls

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export interface AdBrand {
    id: string;
    name: string;
    logo_url?: string;
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
 * Fetches all ad brands from the backend API.
 * @returns Promise<AdBrand[]> - Array of brands or empty array on error
 */
export async function fetchAdBrands(): Promise<AdBrand[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/ad-brands`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for auth if needed
        });

        if (!response.ok) {
            console.error(`Failed to fetch brands: ${response.status} ${response.statusText}`);
            return [];
        }

        const data: BrandResponse = await response.json();

        if (!data.success) {
            console.error('API returned success: false');
            return [];
        }

        return data.brands || [];
    } catch (error) {
        console.error('Error fetching ad brands:', error);
        return [];
    }
}

/**
 * Fetches a single brand by ID.
 * @param brandId - The brand ID to fetch
 * @returns Promise<AdBrand | null> - The brand or null if not found
 */
export async function fetchAdBrandById(brandId: string): Promise<AdBrand | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/ad-brands/${brandId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            console.error(`Failed to fetch brand ${brandId}: ${response.status}`);
            return null;
        }

        const data = await response.json();
        return data.brand || null;
    } catch (error) {
        console.error(`Error fetching brand ${brandId}:`, error);
        return null;
    }
}
