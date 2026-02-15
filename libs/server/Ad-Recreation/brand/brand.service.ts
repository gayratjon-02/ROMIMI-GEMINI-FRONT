// libs/server/Ad-Recreation/brand/brand.service.ts
// Service layer for Ad Recreation Brand API calls
import axiosClient from '@/libs/server/axios-client';

export interface BrandAssets {
    logo_light?: string;
    logo_dark?: string;
}

export interface AdBrand {
    id: string;
    name: string;
    industry?: string;
    website?: string;
    currency?: string;
    assets?: BrandAssets;
    brand_playbook?: any;
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
    const response = await axiosClient.get<BrandResponse>('/api/brands');

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
        const response = await axiosClient.get<{ brand: AdBrand }>(`/api/brands/${brandId}`);
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

    const response = await axiosClient.post<SingleBrandResponse>('/api/brands', payload);

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create brand');
    }

    return response.data.brand;
}

/**
 * Brand Playbook JSON structure (enhanced)
 */
export interface BrandPlaybookJson {
    brand_name: string;
    website: string;
    industry?: string;
    brand_colors: {
        primary: string;
        secondary: string;
        background: string;
        accent?: string;
        text_dark: string;
        text_light?: string;
    };
    typography: {
        headline: string;
        body: string;
    };
    tone_of_voice: string;
    target_audience: {
        gender: string;
        age_range: string;
        personas?: string[];
    };
    compliance?: {
        region: string;
        rules: string[];
    };
    usp_offers?: {
        key_benefits: string[];
        current_offer: string;
    };
}

/**
 * Response from analyze endpoint (only playbook, no brand created)
 */
interface AnalyzeOnlyResponse {
    success: boolean;
    message: string;
    playbook: BrandPlaybookJson;
}

/**
 * Response from confirm endpoint (brand is created)
 */
interface ConfirmBrandResponse {
    success: boolean;
    message: string;
    brand: AdBrand;
}

/**
 * Analyzes brand assets WITHOUT creating the brand.
 * Returns playbook JSON for user to review/edit.
 * @param data - Brand data with either file or text_content
 * @returns Promise with analyzed playbook JSON
 */
export async function analyzeBrandOnly(data: AnalyzeBrandData): Promise<AnalyzeOnlyResponse> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('website', data.website);

    if (data.file) {
        formData.append('file', data.file);
    }
    if (data.text_content) {
        formData.append('text_content', data.text_content);
    }

    const response = await axiosClient.post<AnalyzeOnlyResponse>('/api/brands/analyze', formData);

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to analyze brand');
    }

    return response.data;
}

/**
 * Creates brand with the user-edited playbook.
 * Called when user clicks "Save Brand" after reviewing JSON.
 * @param name - Brand name
 * @param website - Brand website
 * @param playbook - The edited playbook JSON
 * @returns Promise with created brand
 */
export async function confirmAndCreateBrand(
    name: string,
    website: string,
    industry: string,
    currency: string,
    playbook: BrandPlaybookJson
): Promise<AdBrand> {
    const response = await axiosClient.post<ConfirmBrandResponse>('/api/brands/confirm', {
        name,
        website,
        industry,
        currency,
        playbook,
    });

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create brand');
    }

    return response.data.brand;
}

/**
 * Updates the brand playbook JSON (for existing brands).
 * @param brandId - The brand ID
 * @param playbook - The edited playbook JSON
 * @returns Promise with updated brand
 */
export async function updateBrandPlaybook(brandId: string, playbook: BrandPlaybookJson): Promise<AdBrand> {
    const response = await axiosClient.patch<{ success: boolean; message: string; brand: AdBrand }>(
        `/api/brands/${brandId}/playbook`,
        { playbook }
    );

    if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update playbook');
    }

    return response.data.brand;
}
