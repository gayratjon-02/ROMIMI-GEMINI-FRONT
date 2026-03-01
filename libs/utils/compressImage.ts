const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Compress an image file if it exceeds 10MB using Canvas API.
 * Returns the original file if already under limit.
 */
export async function compressImage(file: File): Promise<File> {
	if (file.size <= MAX_FILE_SIZE) return file;

	const bitmap = await createImageBitmap(file);
	const canvas = document.createElement('canvas');

	// Scale down proportionally if very large dimensions
	let { width, height } = bitmap;
	const maxDim = 2048;
	if (width > maxDim || height > maxDim) {
		const ratio = Math.min(maxDim / width, maxDim / height);
		width = Math.round(width * ratio);
		height = Math.round(height * ratio);
	}

	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext('2d')!;
	ctx.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();

	// Try progressively lower quality until under limit
	let quality = 0.8;
	let blob: Blob | null = null;

	while (quality >= 0.3) {
		blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/jpeg', quality)
		);
		if (blob && blob.size <= MAX_FILE_SIZE) break;
		quality -= 0.1;
	}

	if (!blob || blob.size > MAX_FILE_SIZE) {
		// Last resort: scale down further and re-draw from source
		canvas.width = Math.round(width * 0.5);
		canvas.height = Math.round(height * 0.5);
		const bitmap2 = await createImageBitmap(file);
		ctx.drawImage(bitmap2, 0, 0, canvas.width, canvas.height);
		bitmap2.close();
		blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, 'image/jpeg', 0.7)
		);
	}

	if (!blob) throw new Error('Failed to compress image');

	return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
		type: 'image/jpeg',
		lastModified: Date.now(),
	});
}
