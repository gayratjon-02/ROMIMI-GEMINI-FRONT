// Collection Types

export interface Collection {
    id: string;
    brand_id: string;
    name: string;
    code: string;
    description?: string;
    da_reference_image_url?: string;
    analyzed_da_json?: Record<string, any>;
    fixed_elements?: Record<string, any>;
    prompt_templates?: Record<string, any>;
    is_preset: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateCollectionData {
    name: string;
    brand_id: string;
    code?: string;
    description?: string;
}

export interface UpdateCollectionData {
    name?: string;
    code?: string;
    description?: string;
    brand_id?: string;
    da_reference_image_url?: string;
    analyzed_da_json?: Record<string, any>;
    fixed_elements?: Record<string, any>;
    prompt_templates?: Record<string, any>;
}
