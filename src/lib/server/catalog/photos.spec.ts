import { expect, it, vi } from 'vitest';
import { localDatabase } from '../testing/local-d1';
import { addProductPhoto } from './photos';

const webp = new Uint8Array([82, 73, 70, 70, 12, 0, 0, 0, 87, 69, 66, 80, 86, 80, 56, 32]);

it('rejects unsafe media and cleans R2 after a failed draft metadata write', async () => {
	const put = vi.fn(async () => ({}));
	const remove = vi.fn(async () => undefined);
	const bucket = { put, delete: remove };
	const { db } = localDatabase();
	await expect(
		addProductPhoto(db, bucket, 'test-id', {
			bytes: webp,
			contentType: 'image/svg+xml',
			position: 1,
			altText: 'TEST ONLY garment'
		})
	).rejects.toThrow('Invalid photo');
	expect(put).not.toHaveBeenCalled();
	await expect(
		addProductPhoto(db, bucket, 'test-id', {
			bytes: webp,
			contentType: 'image/webp',
			position: 1,
			altText: 'TEST ONLY garment'
		})
	).rejects.toThrow('Draft not available');
	expect(put).toHaveBeenCalledOnce();
	expect(remove).toHaveBeenCalledOnce();
});

it('stores validated WebP bytes and ordered metadata for a draft', async () => {
	const put = vi.fn(async () => ({}));
	const remove = vi.fn(async () => undefined);
	const { db, sqlite } = localDatabase();
	const photo = await addProductPhoto(db, { put, delete: remove }, 'test-draft', {
		bytes: webp,
		contentType: 'image/webp',
		position: 2,
		altText: 'TEST ONLY olive shirt'
	});
	expect(photo).toMatchObject({ position: 2, alt_text: 'TEST ONLY olive shirt' });
	expect(photo.r2_key).toMatch(/^products\/test-draft\/[^/]+\.webp$/);
	expect(
		sqlite
			.prepare(
				"SELECT position, alt_text FROM product_photos WHERE product_id = 'test-draft' AND position = 2"
			)
			.get()
	).toEqual({ position: 2, alt_text: 'TEST ONLY olive shirt' });
	expect(put).toHaveBeenCalledWith(photo.r2_key, webp, {
		httpMetadata: { contentType: 'image/webp' }
	});
	expect(remove).not.toHaveBeenCalled();
});
