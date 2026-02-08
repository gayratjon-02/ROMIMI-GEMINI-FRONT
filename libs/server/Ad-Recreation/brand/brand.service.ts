// libs/server/Ad-Recreation/brand/brand.service.ts
// Service layer for Ad Recreation Brand API calls
import axiosClient from '@/libs/server/axios-client';

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

interface SingleBrandResponse {
    success: boolean;
    brand: AdBrand;
    message?: string;
}

/**
 * Fetches all ad brands from the backend API.
 * @returns Promise<AdBrand[]> - Array of brands or empty array on error
 */
export async function fetchAdBrands(): Promise<AdBrand[]> {
    const response = await axiosClient.get<BrandResponse>('/api/ad-brands');

    if (!response.data.success) {
        console.error('API returned success: false');
        return [];
    }

    return response.data.brands || [];
}

/**
 * Fetches a single brand by ID.
 * @param brandId - The brand ID to fetch
 * @returns Promise<AdBrand | null> - The brand or null if not found
 */
export async function fetchAdBrandById(brandId: string): Promise<AdBrand | null> {
    try {
        const response = await axiosClient.get<{ brand: AdBrand }>(`/api/ad-brands/${brandId}`);
        return response.data.brand || null;
    } catch (error) {
        console.error(`Failed to fetch brand ${brandId}:`, error);
        return null;
    }
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
 * Interface for analyze and create brand request
 */
export interface AnalyzeBrandData {
    name: string;
    website: string;
    text_content?: string;
    file?: File;
}

/**
 * Creates a new brand.
 * @param data - Brand creation data
 * @returns Promise<AdBrand> - The created brand
 * @throws Error if creation fails
 */
export async function createBrand(data: CreateBrandData): Promise<AdBrand> {
    // Transform data: map website_url -> website and inject P0 defaults
    // NOTE: Backend DTO does NOT accept 'description' - stripped out
    const payload = {
        name: data.name,
        website: data.website_url, // API expects 'website' not 'website_url'
        industry: 'General', // P0 default - skipable advanced field
    };

    const response = await axiosClient.post<SingleBrandResponse>('/api/ad-brands', payload);

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create brand');
    }

    return response.data.brand;
}

/**
 * Brand Playbook JSON structure
 */
export interface BrandPlaybookJson {
    brand_name: string;
    website: string;
    brand_colors: {
        primary: string;
        secondary: string;
        background: string;
        text_dark: string;
    };
    typography: {
        headline: string;
        body: string;
    };
    tone_of_voice: string;
    target_audience: {
        gender: string;
        age_range: string;
    };
}

/**
 * Response from analyze endpoint
 */
interface AnalyzeBrandResponse {
    success: boolean;
    message: string;
    brand_id: string;
    brand_name: string;
    playbook: BrandPlaybookJson;
}

/**
 * Analyzes brand assets and creates a brand in one step.
 * @param data - Brand data with either file or text_content
 * @returns Promise with brand_id and playbook JSON
 */
export async function analyzeAndCreateBrand(data: AnalyzeBrandData): Promise<AnalyzeBrandResponse> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('website', data.website);

    if (data.file) {
        formData.append('file', data.file);
    }
    if (data.text_content) {
        formData.append('text_content', data.text_content);
    }

    const response = await axiosClient.post<AnalyzeBrandResponse>('/api/ad-brands/analyze', formData);

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to analyze brand');
    }

    return response.data;
}

/**
 * Updates the brand playbook JSON.
 * @param brandId - The brand ID
 * @param playbook - The edited playbook JSON
 * @returns Promise with updated brand
 */
export async function updateBrandPlaybook(brandId: string, playbook: any): Promise<AdBrand> {
    const response = await axiosClient.patch<{ success: boolean; message: string; brand: AdBrand }>(
        `/api/ad-brands/${brandId}/playbook`,
        { playbook }
    );

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update playbook');
    }

    return response.data.brand;
}
