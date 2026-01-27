// Generation/Merging Types

export interface VisualOutput {
    type: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    image_url?: string;
    prompt?: string;
    generated_at?: string;
    error?: string;
}

export interface MergedPrompts {
    main_visual?: string;
    secondary_visuals?: string[];
    style_reference?: string;
    prompts_by_type?: Record<string, string>;
    [key: string]: any;
}

export interface Generation {
    id: string;
    user_id: string;
    product_id: string;
    collection_id: string;
    generation_type: string;
    status: 'draft' | 'pending' | 'merged' | 'processing' | 'completed' | 'failed';
    merged_prompts?: MergedPrompts;
    visual_outputs?: VisualOutput[];
    zip_url?: string;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
    product?: any;
    collection?: any;
}

export interface CreateGenerationData {
    product_id: string;
    collection_id: string;
    generation_type?: string;
}

export interface UpdateGenerationData {
    status?: string;
    merged_prompts?: MergedPrompts;
    visual_outputs?: VisualOutput[];
}

export interface GenerateData {
    prompts?: string[];
    visualTypes?: string[];
    model?: string;
}

export interface MergePromptsData {
    custom_instructions?: string;
}

export interface UpdateMergedPromptsData {
    prompts: MergedPrompts;
}

export interface GenerationsListResponse {
    items: Generation[];
    total: number;
    page: number;
    limit: number;
}

export interface MergePromptsResponse {
    generation_id: string;
    merged_prompts: MergedPrompts;
    status: string;
    merged_at: string;
}

export interface UpdatePromptsResponse {
    merged_prompts: MergedPrompts;
    updated_at: string;
}

export interface GetPromptsResponse {
    generation_id: string;
    merged_prompts: MergedPrompts;
    product_json: any;
    da_json: any;
    can_edit: boolean;
}

export interface GenerationProgressResponse {
    generation_id: string;
    status: string;
    total_visuals: number;
    completed_visuals: number;
    progress_percentage: number;
    visual_outputs: VisualOutput[];
}
