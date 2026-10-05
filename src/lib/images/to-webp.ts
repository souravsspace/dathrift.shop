// Product photos are converted to WebP in the admin browser before upload.
// Re-drawing through a canvas also drops EXIF metadata such as GPS location.
export const MAX_EDGE = 2000;
export const QUALITY = 0.82;

export function fitWithin(width: number, height: number, max = MAX_EDGE) {
	const scale = Math.min(1, max / Math.max(width, height));
	return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

// Safari cannot export WebP from a canvas, so those browsers use the wasm encoder instead.
export async function encodeWithWasm(data: ImageData, quality: number): Promise<Blob> {
	const { default: encode } = await import('@jsquash/webp/encode');
	const buffer = await encode(data, { quality: Math.round(quality * 100) });
	return new Blob([buffer], { type: 'image/webp' });
}

export async function toWebp(file: File) {
	const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
	const { width, height } = fitWithin(bitmap.width, bitmap.height);
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Canvas unavailable');
	context.imageSmoothingQuality = 'high';
	context.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();
	let blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, 'image/webp', QUALITY)
	);
	if (blob?.type !== 'image/webp')
		blob = await encodeWithWasm(context.getImageData(0, 0, width, height), QUALITY);
	const name = `${file.name.replace(/\.[^.]+$/, '') || 'photo'}.webp`;
	return { file: new File([blob], name, { type: 'image/webp' }), width, height };
}
