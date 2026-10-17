import { expect, it } from 'vitest';
import { SOCIAL_FORMATS } from './formats';
import { containRect, frameFor, renderSocialImage } from './render';

const format = (id: string) => SOCIAL_FORMATS.find((item) => item.id === id)!;

// A tall photo: rust with a green border, so the edges show whether anything was cut off.
async function photo(width: number, height: number) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d')!;
	context.fillStyle = '#134533';
	context.fillRect(0, 0, width, height);
	context.fillStyle = '#a63d26';
	context.fillRect(20, 20, width - 40, height - 40);
	return createImageBitmap(canvas);
}

async function pixels(blob: Blob) {
	const bitmap = await createImageBitmap(blob);
	const canvas = document.createElement('canvas');
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	const context = canvas.getContext('2d')!;
	context.drawImage(bitmap, 0, 0);
	return {
		width: bitmap.width,
		height: bitmap.height,
		at: (x: number, y: number) => [...context.getImageData(x, y, 1, 1).data.slice(0, 3)]
	};
}

it('fits the whole photo inside the frame, centred', () => {
	expect(containRect(1500, 2000, 1080, 1080)).toEqual({ x: 135, y: 0, width: 810, height: 1080 });
	expect(containRect(2000, 1000, 1080, 1920)).toEqual({ x: 0, y: 690, width: 1080, height: 540 });
});

it('exports every format at its exact size as PNG and JPEG', async () => {
	const source = await photo(1500, 2000);
	for (const item of SOCIAL_FORMATS.filter((format) => format.kind !== 'original')) {
		const png = await renderSocialImage(item, source, null, 'image/png');
		expect(png.type).toBe('image/png');
		const image = await pixels(png);
		expect([image.width, image.height]).toEqual([item.width, item.height]);
	}
	const jpeg = await renderSocialImage(format('ig-square'), source, null, 'image/jpeg');
	expect(jpeg.type).toBe('image/jpeg');
});

it('pads with the paper colour instead of cropping', async () => {
	const image = await pixels(
		await renderSocialImage(format('fb-landscape'), await photo(1500, 2000), null, 'image/png')
	);
	// Paper on both sides; the photo's green border survives at the top and bottom edges.
	expect(image.at(10, 540)).toEqual([250, 247, 241]);
	expect(image.at(1910, 540)).toEqual([250, 247, 241]);
	expect(image.at(960, 2)).toEqual([19, 69, 51]);
	expect(image.at(960, 1077)).toEqual([19, 69, 51]);
});

it('draws the swing tag in the bottom-left corner only when asked', async () => {
	const source = await photo(1080, 1080);
	const facts = { price: '৳1,200', size: 'Size M', code: 'OC2026005', cta: 'Inbox to order' };
	const plain = await pixels(
		await renderSocialImage(format('ig-square'), source, null, 'image/png')
	);
	const tagged = await pixels(
		await renderSocialImage(format('ig-square'), source, facts, 'image/png')
	);
	// Ivory tag paper near the bottom-left, rust photo there without the tag.
	expect(plain.at(80, 1010)).toEqual([166, 61, 38]);
	expect(tagged.at(80, 1010)).toEqual([251, 235, 214]);
	expect(tagged.at(1000, 80)).toEqual(plain.at(1000, 80));
});

it('keeps the original format at the photo size with nothing added, and scales previews', async () => {
	const source = await photo(1500, 2000);
	const original = await pixels(
		await renderSocialImage(format('original'), source, null, 'image/png')
	);
	expect([original.width, original.height]).toEqual([1500, 2000]);
	expect(original.at(2, 2)).toEqual([19, 69, 51]);
	expect(original.at(750, 1000)).toEqual([166, 61, 38]);
	expect(frameFor(format('original'), source, 0.4)).toMatchObject({ width: 600, height: 800 });
	const preview = await pixels(
		await renderSocialImage(format('ig-story'), source, null, 'image/png', 0.95, 0.4)
	);
	expect([preview.width, preview.height]).toEqual([432, 768]);
});
