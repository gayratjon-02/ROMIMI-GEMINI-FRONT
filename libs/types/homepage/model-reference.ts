export interface ModelReference {
	id: string;
	brand_id: string;
	user_id: string;
	name: string;
	type: 'adult' | 'kid';
	image_url: string;
	created_at: string;
	updated_at: string;
}
