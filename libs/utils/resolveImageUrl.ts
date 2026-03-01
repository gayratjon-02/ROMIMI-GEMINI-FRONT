const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://romimi-visual-generator.s3.eu-west-3.amazonaws.com';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

/**
 * Resolves image URLs.
 * - S3 URLs → returned as-is
 * - Full server URLs (http://...) → returned as-is (works for <img> cross-origin)
 * - Relative paths (/uploads/...) → resolved to API server URL
 */
export function resolveImageUrl(url: string | undefined | null): string | undefined {
	if (!url) return undefined;
	if (url.startsWith('data:')) return url;

	// Already an S3 URL — return as-is
	if (url.includes('.s3.') || url.includes('.amazonaws.com')) return url;

	// Full URL to any server (local/production) — return as-is
	if (url.startsWith('http://') || url.startsWith('https://')) return url;

	// Relative path like /uploads/... — resolve to API server
	const cleanPath = url.startsWith('/') ? url : `/${url}`;
	return `${API_BASE_URL}${cleanPath}`;
}
