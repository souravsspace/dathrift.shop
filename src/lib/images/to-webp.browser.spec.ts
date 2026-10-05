import { expect, it } from 'vitest';
import { encodeWithWasm, toWebp } from './to-webp';
import heicUrl from './fixtures/test-only-dress.heic?url';

const isWebp = (bytes: Uint8Array) =>
	String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
	String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';

async function pngFile(width: number, height: number) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d')!;
	context.fillStyle = '#134533';
	context.fillRect(0, 0, width, height);
	context.fillStyle = '#fbebd6';
	context.fillRect(width / 4, height / 4, width / 2, height / 2);
	const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
	return new File([blob], 'IMG_0001.png', { type: 'image/png' });
}

it('converts an oversized photo into a resized WebP file', async () => {
	const result = await toWebp(await pngFile(3000, 1500));
	expect(result.file.type).toBe('image/webp');
	expect(result.file.name).toBe('IMG_0001.webp');
	expect({ width: result.width, height: result.height }).toEqual({ width: 2000, height: 1000 });
	expect(isWebp(new Uint8Array(await result.file.arrayBuffer()))).toBe(true);
});

it('encodes WebP with the wasm fallback used by browsers without native WebP export', async () => {
	const data = new ImageData(64, 48);
	data.data.fill(200);
	const blob = await encodeWithWasm(data, 0.82);
	expect(blob.type).toBe('image/webp');
	expect(isWebp(new Uint8Array(await blob.arrayBuffer()))).toBe(true);
});

it('rejects files that are not images or are larger than 10 MB', async () => {
	await expect(toWebp(new File(['hello'], 'notes.txt', { type: 'text/plain' }))).rejects.toThrow(
		'Choose an image file'
	);
	const huge = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'huge.jpg', {
		type: 'image/jpeg'
	});
	await expect(toWebp(huge)).rejects.toThrow('Image is larger than 10 MB');
});

it('explains when the browser cannot read an image format', async () => {
	const broken = new File([new Uint8Array([1, 2, 3, 4])], 'photo.heic', { type: 'image/heic' });
	await expect(toWebp(broken)).rejects.toThrow('This browser cannot read that image');
});

it('converts an iPhone HEIC photo even where the browser cannot decode HEIC itself', async () => {
	const bytes = await (await fetch(heicUrl)).arrayBuffer();
	// Some phones hand over HEIC files with no MIME type at all.
	for (const type of ['image/heic', '']) {
		const result = await toWebp(new File([bytes], 'IMG_0420.HEIC', { type }));
		expect(result.file.type).toBe('image/webp');
		expect(result.file.name).toBe('IMG_0420.webp');
		expect({ width: result.width, height: result.height }).toEqual({ width: 240, height: 300 });
		expect(isWebp(new Uint8Array(await result.file.arrayBuffer()))).toBe(true);
	}
});
