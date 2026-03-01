const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://romimi-visual-generator.s3.eu-west-3.amazonaws.com';

/**
 * Resolves image URLs to S3.
 * Converts old localhost/server URLs to actual S3 URLs.
 */
export function resolveImageUrl(url: string | undefined | null): string | undefined {
	if (!url) return undefined;
	if (url.startsWith('data:')) return url;

	// Already an S3 URL
	if (url.includes('.s3.') || url.includes('.amazonaws.com')) return url;

	// Extract path from old URLs: http://localhost:4001/uploads/... → uploads/...
	try {
		const parsed = new URL(url);
		const pathOnly = parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname;
		return `${S3_BASE_URL}/${pathOnly}`;
	} catch {
		// Relative path like /uploads/...
		const pathOnly = url.startsWith('/') ? url.slice(1) : url;
		return `${S3_BASE_URL}/${pathOnly}`;
	}
}
