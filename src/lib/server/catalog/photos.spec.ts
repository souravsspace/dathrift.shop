import { expect, it, vi } from 'vitest';
import { localDatabase } from '../testing/local-d1';
import { addProductPhoto, makeCoverPhoto } from './photos';

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

it('accepts only WebP photos within the 10 MB upload limit', async () => {
	const put = vi.fn(async () => ({}));
	const bucket = { put, delete: vi.fn(async () => undefined) };
	const { db } = localDatabase();
	const jpeg = new Uint8Array(16).fill(0);
	jpeg.set([0xff, 0xd8, 0xff]);
	const png = new Uint8Array(16).fill(0);
	png.set([137, 80, 78, 71, 13, 10, 26, 10]);
	const oversized = new Uint8Array(10 * 1024 * 1024 + 1);
	oversized.set(webp);
	for (const [bytes, contentType] of [
		[jpeg, 'image/jpeg'],
		[png, 'image/png'],
		[webp, 'image/jpeg'],
		[oversized, 'image/webp']
	] as const)
		await expect(
			addProductPhoto(db, bucket, 'test-draft', {
				bytes,
				contentType,
				position: 2,
				altText: 'TEST ONLY garment'
			})
		).rejects.toThrow('Invalid photo');
	expect(put).not.toHaveBeenCalled();
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

it('accepts a large WebP up to the 10 MB limit', async () => {
	const put = vi.fn(async () => ({}));
	const { db } = localDatabase();
	const large = new Uint8Array(5 * 1024 * 1024);
	large.set(webp);
	await expect(
		addProductPhoto(db, { put, delete: vi.fn(async () => undefined) }, 'test-draft', {
			bytes: large,
			contentType: 'image/webp',
			position: 2,
			altText: 'TEST ONLY large photo'
		})
	).resolves.toMatchObject({ position: 2 });
	expect(put).toHaveBeenCalledOnce();
});

it('holds up to ten photos per piece', async () => {
	const bucket = { put: vi.fn(async () => ({})), delete: vi.fn(async () => undefined) };
	const { db } = localDatabase();
	const photo = (position: number) => ({
		bytes: webp,
		contentType: 'image/webp',
		position,
		altText: `TEST ONLY photo ${position}`
	});
	await expect(addProductPhoto(db, bucket, 'test-draft', photo(10))).resolves.toMatchObject({
		position: 10
	});
	await expect(addProductPhoto(db, bucket, 'test-draft', photo(11))).rejects.toThrow(
		'Invalid photo'
	);
});

it('moves the chosen photo to the front as the cover, keeping the rest in order', async () => {
	const { db, sqlite } = localDatabase();
	sqlite.exec(`INSERT INTO product_photos (product_id, position, r2_key, alt_text) VALUES
		('test-dress', 2, 'test-only/dress-back.webp', 'TEST ONLY back'),
		('test-dress', 3, 'test-only/dress-hem.webp', 'TEST ONLY hem')`);
	const order = () =>
		sqlite
			.prepare(
				"SELECT position, r2_key FROM product_photos WHERE product_id = 'test-dress' ORDER BY position"
			)
			.all()
			.map((row) => row.r2_key);
	expect(await makeCoverPhoto(db, 'test-dress', 'test-only/dress-hem.webp')).toEqual([
		{ position: 1, r2_key: 'test-only/dress-hem.webp', alt_text: 'TEST ONLY hem' },
		{
			position: 2,
			r2_key: 'test-only/cream-dress.webp',
			alt_text: 'Generated test-only cream midi dress visual'
		},
		{ position: 3, r2_key: 'test-only/dress-back.webp', alt_text: 'TEST ONLY back' }
	]);
	expect(order()).toEqual([
		'test-only/dress-hem.webp',
		'test-only/cream-dress.webp',
		'test-only/dress-back.webp'
	]);
	await expect(makeCoverPhoto(db, 'test-dress', 'test-only/missing.webp')).rejects.toThrow(
		'Photo not found'
	);
	await expect(makeCoverPhoto(db, 'test-shirt', 'test-only/dress-hem.webp')).rejects.toThrow(
		'Photo not found'
	);
});
