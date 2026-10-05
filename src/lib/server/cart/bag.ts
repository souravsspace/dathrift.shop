import { and, eq, inArray } from 'drizzle-orm';
import type { Database } from '../db/client';
import { productPhotos, products } from '../db/schema';

// Display-only details for bag lines (first photo and tagged size); prices come from repriceCart.
export async function bagLineDetails(db: Database, ids: string[]) {
	if (!ids.length) return new Map<string, BagLineDetails>();
	const rows = await db
		.select({
			id: products.id,
			size_label: products.sizeLabel,
			photo_key: productPhotos.r2Key,
			photo_alt: productPhotos.altText
		})
		.from(products)
		.leftJoin(
			productPhotos,
			and(eq(productPhotos.productId, products.id), eq(productPhotos.position, 1))
		)
		.where(and(inArray(products.id, ids), eq(products.publicationState, 'published')));
	return new Map(rows.map(({ id, ...details }) => [id, details]));
}

export type BagLineDetails = {
	size_label: string | null;
	photo_key: string | null;
	photo_alt: string | null;
};
