// Product Types

export interface AnalyzedProductJSON {
    product_type?: string;
    colors?: string[];
    materials?: string[];
    style_keywords?: string[];
    features?: string[];
    target_audience?: string;
    season?: string;
    occasion?: string;
    analyzed_at?: string;
    [key: string]: any;
}

export interface Product {
    id: string;
    user_id: string;
    collection_id: string;
    name: string;
    front_image_url?: string;
    back_image_url?: string;
    reference_images?: string[];
    analyzed_product_json?: AnalyzedProductJSON;
    final_product_json?: AnalyzedProductJSON;
    manual_overrides?: Record<string, any>;
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
