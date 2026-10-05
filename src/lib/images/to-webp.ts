// Product photos are converted to WebP in the admin browser before upload.
// Re-drawing through a canvas also drops EXIF metadata such as GPS location.
export const MAX_EDGE = 2000;
export const QUALITY = 0.82;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

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

const isHeic = (file: File) => /^image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);

// Safari decodes HEIC natively. Chrome and Android do not, so iPhone photos there go through
// a libheif wasm decoder that is only downloaded when a HEIC file is actually picked.
async function decode(file: File): Promise<ImageBitmap> {
	const unreadable = () =>
		new Error('This browser cannot read that image. Try a JPEG, PNG, WebP or HEIC.');
	try {
		return await createImageBitmap(file, { imageOrientation: 'from-image' });
	} catch {
		if (!isHeic(file)) throw unreadable();
		const { heicTo } = await import('heic-to');
		return heicTo({ blob: file, type: 'bitmap' }).catch(() => {
			throw unreadable();
		});
	}
}

export async function toWebp(file: File) {
	// Some HEIC files arrive with no MIME type; the decoder decides whether they are readable.
	if (file.type && !file.type.startsWith('image/')) throw new Error('Choose an image file');
	if (file.size > MAX_UPLOAD_BYTES) throw new Error('Image is larger than 10 MB');
	const bitmap = await decode(file);
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
