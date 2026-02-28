
// Types
export interface Brand {
  id: string;
  name: string;
  brand_brief?: string;
  model_adult_url?: string;
  model_kid_url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandData {
  name: string;
  brand_brief?: string;
}

export interface UpdateBrandData {
  name?: string;
  brand_brief?: string;
}
