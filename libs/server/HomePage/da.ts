/**
 * DA (Design Aesthetics) Presets API
 * Backend: /api/da/*
 */

import {
    API_URL_NEXT,
    AuthApiError,
    Messages,
} from "@/libs/components/types/config";
import { getAuthToken } from "./signup";

const API_BASE = `${API_URL_NEXT}/api`;

function getAuthHeaders(json = true): HeadersInit {
    const token = getAuthToken();
    return {
        ...(json && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}

export interface DAPresetItem {
    id: string;
    name: string;
    code: string;
    description?: string;
    is_default: boolean;
    image_url?: string;
    created_at: string;
    updated_at: string;
}

export interface DAPresetConfig {
    da_name: string;
    background: { type: string; hex: string };
    floor: { type: string; hex: string };
    props: { left_side: string[]; right_side: string[] };
    styling: { pants: string; footwear: string };
    lighting: { type: string; temperature: string };
    mood: string;
    quality: string;
}

export interface GetPresetsResponse {
    total: number;
    system_presets: number;
    user_presets: number;
    presets: DAPresetItem[];
}

export interface GetPresetByIdResponse {
    preset: DAPresetItem;
    config: DAPresetConfig;
}

/**
 * GET /api/da/presets — all DA presets (system + user)
 */
export async function getDAPresets(): Promise<GetPresetsResponse> {
    const response = await fetch(`${API_BASE}/da/presets`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
        const msg = Array.isArray(data.message) ? data.message : [data.message || "Failed to fetch DA presets"];
        throw new AuthApiError(response.status, msg, data);
    }
    return data as GetPresetsResponse;
}

/**
 * GET /api/da/presets/:id — single preset + config
 */
export async function getDAPresetById(id: string): Promise<GetPresetByIdResponse> {
    const response = await fetch(`${API_BASE}/da/presets/${id}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
        const msg = Array.isArray(data.message) ? data.message : [data.message || "Failed to fetch preset"];
        throw new AuthApiError(response.status, msg, data);
    }
    return data as GetPresetByIdResponse;
}

/**
 * POST /api/da/analyze — upload image + analyze + save to DB (Create DA)
 * FormData: image (file), preset_name (optional)
 */
export async function createDAPresetFromImage(formData: FormData): Promise<{
    success: boolean;
    data: { id: string; name: string; result: DAPresetConfig; imageUrl: string };
}> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE}/da/analyze`, {
        method: "POST",
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            // Do NOT set Content-Type; browser sets multipart/form-data with boundary
        },
        body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
        const msg = Array.isArray(data.message) ? data.message : [data.message || "Failed to create DA"];
        throw new AuthApiError(response.status, msg, data);
    }
    return data;
}

/**
 * PUT /api/da/presets/:id/analysis — update preset analysis
 */
export async function updateDAPresetAnalysis(
    id: string,
    analysis: DAPresetConfig
): Promise<{ success: boolean; preset: DAPresetItem; config: DAPresetConfig; message: string }> {
    const response = await fetch(`${API_BASE}/da/presets/${id}/analysis`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(analysis),
    });
    const data = await response.json();
    if (!response.ok) {
        const msg = Array.isArray(data.message) ? data.message : [data.message || "Failed to update preset"];
        throw new AuthApiError(response.status, msg, data);
    }
    return data;
}

/**
 * POST /api/da/presets/delete/:id — delete preset (only user created ones)
 */
export async function deleteDAPreset(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/da/presets/delete/${id}`, {
        method: "POST",
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
        const msg = Array.isArray(data.message) ? data.message : [data.message || "Failed to delete preset"];
        throw new AuthApiError(response.status, msg, data);
    }
    return data;
}
