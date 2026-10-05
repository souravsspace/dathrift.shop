import { expect, it } from 'vitest';
import { encodeWithWasm, toWebp } from './to-webp';

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
