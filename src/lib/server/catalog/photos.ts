import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { inventory, productPhotos, products } from '../db/schema';

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
		input.position > 8 ||
		!input.altText.trim() ||
		input.altText.length > 240 ||
		input.bytes.length < 16 ||
		input.bytes.length > 3 * 1024 * 1024 ||
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
		if (result.meta.changes !== 1) throw new Error('Draft not available');
	} catch (error) {
		await bucket.delete(key);
		throw error;
	}
	return { position: input.position, r2_key: key, alt_text: input.altText.trim() };
}
