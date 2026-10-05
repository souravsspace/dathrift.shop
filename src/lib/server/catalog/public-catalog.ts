import { and, desc, eq } from 'drizzle-orm';
import type { Database } from '../db/client';
import { inventory, productPhotos, products } from '../db/schema';

export type PublicProduct = {
	id: string;
	slug: string;
	name: string;
	category: 'tops' | 'bottoms' | 'outerwear' | 'dresses';
	price_bdt: number;
	stock_state: 'available' | 'reserved' | 'sold';
};

export type PublicListing = PublicProduct & {
	size_label: string | null;
	condition_notes: string | null;
	photo_key: string | null;
	photo_alt: string | null;
};

const publicColumns = {
	id: products.id,
	slug: products.slug,
	name: products.name,
	category: products.category,
	price_bdt: products.priceBdt,
	stock_state: inventory.state
};

export async function listPublicProducts(db: Database): Promise<PublicListing[]> {
	return db
		.select({
			...publicColumns,
			size_label: products.sizeLabel,
			condition_notes: products.conditionNotes,
			photo_key: productPhotos.r2Key,
			photo_alt: productPhotos.altText
		})
		.from(products)
		.innerJoin(inventory, eq(inventory.productId, products.id))
		.leftJoin(
			productPhotos,
			and(eq(productPhotos.productId, products.id), eq(productPhotos.position, 1))
		)
		.where(eq(products.publicationState, 'published'))
		.orderBy(desc(products.createdAt), desc(products.id))
		.limit(24);
}

export async function getPublicProduct(db: Database, slug: string): Promise<PublicProduct | null> {
	const row = await db
		.select(publicColumns)
		.from(products)
		.innerJoin(inventory, eq(inventory.productId, products.id))
		.where(and(eq(products.slug, slug), eq(products.publicationState, 'published')))
		.get();
	return row ?? null;
}
