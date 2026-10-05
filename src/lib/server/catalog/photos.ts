import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { inventory, productPhotos, products } from '../db/schema';
import { MAX_PHOTOS } from './publication';

type PhotoInput = {
	bytes: Uint8Array;
	contentType: string;
	position: number;
	altText: string;
};

type PhotoBucket = {
	put(
		key: string,
		bytes: Uint8Array,
		options: { httpMetadata: { contentType: string } }
	): Promise<unknown>;
	delete(key: string): Promise<unknown>;
};

// Uploads are converted to WebP in the admin browser, so the server accepts WebP only.
function isWebp(bytes: Uint8Array, contentType: string): boolean {
	return (
		contentType === 'image/webp' &&
		bytes.length >= 12 &&
		String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
		String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
	);
}

export async function addProductPhoto(
	db: Database,
	bucket: PhotoBucket,
	id: string,
	input: PhotoInput
) {
	if (
		!/^[a-zA-Z0-9-]{1,80}$/.test(id) ||
		!Number.isSafeInteger(input.position) ||
		input.position < 1 ||
		input.position > MAX_PHOTOS ||
		!input.altText.trim() ||
		input.altText.length > 240 ||
		input.bytes.length < 16 ||
		input.bytes.length > 10 * 1024 * 1024 ||
		!isWebp(input.bytes, input.contentType)
	)
		throw new Error('Invalid photo');
	const key = `products/${id}/${crypto.randomUUID()}.webp`;
	await bucket.put(key, input.bytes, { httpMetadata: { contentType: input.contentType } });
	try {
		const result = await db.insert(productPhotos).select(
			db
				.select({
					productId: products.id,
					position: sql<number>`${input.position}`.as('position'),
					r2Key: sql<string>`${key}`.as('r2_key'),
					altText: sql<string>`${input.altText.trim()}`.as('alt_text')
				})
				.from(products)
				.innerJoin(inventory, eq(inventory.productId, products.id))
				.where(
					and(
						eq(products.id, id),
						eq(products.publicationState, 'draft'),
						eq(inventory.state, 'available')
					)
				)
		);
		// D1 counts trigger writes in meta.changes, so only zero means the row was not written.
		if (result.meta.changes === 0) throw new Error('Draft not available');
	} catch (error) {
		await bucket.delete(key);
		throw error;
	}
	return { position: input.position, r2_key: key, alt_text: input.altText.trim() };
}

// Position 1 is the cover the shop shows first. Moving a photo there keeps the others in order;
// the rows are rewritten in one batch so the (product, position) key never collides midway.
export async function makeCoverPhoto(db: Database, id: string, r2Key: string) {
	const photos = await db
		.select({
			position: productPhotos.position,
			r2_key: productPhotos.r2Key,
			alt_text: productPhotos.altText
		})
		.from(productPhotos)
		.where(eq(productPhotos.productId, id))
		.orderBy(asc(productPhotos.position));
	const cover = photos.find((photo) => photo.r2_key === r2Key);
	if (!cover) throw new Error('Photo not found');
	const ordered = [cover, ...photos.filter((photo) => photo !== cover)].map((photo, index) => ({
		...photo,
		position: index + 1
	}));
	await db.batch([
		db.delete(productPhotos).where(
			and(
				eq(productPhotos.productId, id),
				inArray(
					productPhotos.r2Key,
					photos.map((photo) => photo.r2_key)
				)
			)
		),
		db.insert(productPhotos).values(
			ordered.map((photo) => ({
				productId: id,
				position: photo.position,
				r2Key: photo.r2_key,
				altText: photo.alt_text
			}))
		)
	]);
	return ordered;
}
