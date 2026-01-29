// Product Types

// General Info structure from backend
export interface ProductGeneralInfo {
    product_name: string;
    category: string;
    subcategory?: string;
    age_group?: string;
    gender?: string;
}

// Logo structure
export interface ProductLogo {
    position?: string;
    style?: string;
    text?: string;
    size?: string;
    colors?: string[];
}

// Full analyzed product JSON (matches backend AnalyzeProductDirectResponse)
export interface AnalyzedProductJSON {
    general_info: ProductGeneralInfo;
    colors?: {
        primary?: { name: string; hex: string };
        secondary?: { name: string; hex: string }[];
        accent?: { name: string; hex: string }[];
    };
    materials?: string[];
    pattern?: string;
    texture_description?: string;
    design_elements?: string[];
    logo_front?: ProductLogo;
    logo_back?: ProductLogo;
    style_keywords?: string[];
    additional_details?: string;
    analyzed_at?: string;
    [key: string]: any;
}

export interface Product {
    id: string;
    user_id: string;
    collection_id?: string;
    brand_id?: string;
    name: string;
    category?: string;
    front_image_url?: string;
    back_image_url?: string;
    reference_images?: string[];
    analyzed_product_json?: AnalyzedProductJSON | Record<string, any>;
    final_product_json?: AnalyzedProductJSON | Record<string, any>;
    manual_product_overrides?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface CreateProductData {
    name: string;
    collection_id: string;
    front_image_url?: string;
    back_image_url?: string;
    reference_images?: string[];
}

export interface UpdateProductData {
    name?: string;
    front_image_url?: string;
    back_image_url?: string;
    reference_images?: string[];
    analyzed_product_json?: Record<string, any>;
    final_product_json?: Record<string, any>;
}

export interface AnalyzeImagesData {
    images: string[];
    productName: string;
    brandBrief?: string;
}

export interface UpdateProductJsonData {
    manual_overrides: Record<string, any>;
}

export interface ProductsListResponse {
    success: boolean;
    items: Product[];
    total: number;
    page: number;
    limit: number;
}

export interface AnalyzeProductResponse {
    product_id: string;
    analyzed_product_json: AnalyzedProductJSON;
    status: string;
    analyzed_at: string;
}

export interface UpdateProductJsonResponse {
    analyzed_product_json: AnalyzedProductJSON;
    final_product_json: AnalyzedProductJSON;
    updated_at: string;
}

export interface AnalyzeImagesResponse {
    prompt: string;
    extracted_variables: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════
// NEW API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Response from POST /api/products/analyze (Direct Analysis)
 */
export interface AnalyzeProductDirectResponse {
    success: boolean;
    product_id: string;
    name: string;
    category: string;
    analysis: AnalyzedProductJSON;
    imageUrl: string;
    message: string;
    next_step: string;
}

/**
 * Response from GET /api/products/:id (Product with JSONs)
 */
export interface ProductResponse {
    success: boolean;
    product: Product;
    message?: string;
}

/**
 * Response from GET/PUT /api/products/:id/json
 */
export interface ProductJsonResponse {
    success: boolean;
    product_id: string;
    analyzed_product_json: AnalyzedProductJSON | null;
    final_product_json: AnalyzedProductJSON | null;
    has_manual_overrides: boolean;
    message?: string;
}

/**
 * Response from PUT /api/products/:id/analysis
 */
export interface UpdateProductAnalysisResponse {
    success: boolean;
    product_id: string;
    analyzed_product_json: AnalyzedProductJSON;
    message: string;
}
