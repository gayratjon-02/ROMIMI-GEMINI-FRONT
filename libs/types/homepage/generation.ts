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
    /** Backend returns visuals array (generated images per shot) */
    visuals?: VisualOutput[];
    zip_url?: string;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
    product?: { id: string; name: string;[key: string]: any };
    collection?: any;
}

export interface CreateGenerationData {
    product_id: string;
    collection_id: string;
    generation_type?: string;
    /** "2K" | "4K" - used for prompt quality suffix and Gemini imageSize */
    resolution?: string;
    /** "1:1" | "4:5" | "9:16" | "16:9" - passed to Gemini config for output shape */
    aspect_ratio?: string;
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
    resolution?: string;
    aspect_ratio?: string;
}

export interface MergePromptsData {
    custom_instructions?: string;
    /** @deprecated Use shot_options instead */
    model_type?: 'adult' | 'kid';
    /** NEW: Per-shot control options */
    shot_options?: import('./shot-options').ShotOptions;
    /** Resolution for prompt quality: "4K" | "2K" */
    resolution?: string;
    /** Aspect ratio for output: "4:5" | "1:1" | "9:16" | "16:9" */
    aspect_ratio?: string;
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
    status: string;
    progress: number;
    completed: number;
    total: number;
    visuals: VisualOutput[];
    elapsed_seconds?: number;
    estimated_remaining_seconds?: number;
}
