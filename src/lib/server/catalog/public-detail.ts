import { and, asc, eq } from 'drizzle-orm';
import type { Database } from '../db/client';
import { categories, inventory, productPhotos, products, slugRedirects } from '../db/schema';

export type PublicProductDetail = {
	id: string;
	code: string | null;
	slug: string;
	name: string;
	category: string;
	category_name: string;
	brand: string | null;
	price_bdt: number;
	stock_state: 'available' | 'reserved' | 'sold';
	description: string | null;
	condition_notes: string | null;
	size_label: string | null;
	fit_note: string | null;
	measurements: Record<string, number>;
	photos: { key: string; alt: string }[];
};

export async function getPublicProductDetail(
	db: Database,
	slug: string
): Promise<PublicProductDetail | null> {
	const row = await db
		.select({
			id: products.id,
			code: products.code,
			slug: products.slug,
			name: products.name,
			category: products.category,
			category_name: categories.name,
			brand: products.brand,
			price_bdt: products.priceBdt,
			description: products.description,
			condition_notes: products.conditionNotes,
			size_label: products.sizeLabel,
			fit_note: products.fitNote,
			measurements_json: products.measurementsJson,
			stock_state: inventory.state
		})
		.from(products)
		.innerJoin(inventory, eq(inventory.productId, products.id))
		.innerJoin(categories, eq(categories.slug, products.category))
		.where(and(eq(products.slug, slug), eq(products.publicationState, 'published')))
		.get();
	if (!row) return null;
	const photos = await db
		.select({ key: productPhotos.r2Key, alt: productPhotos.altText })
		.from(productPhotos)
		.where(eq(productPhotos.productId, row.id))
		.orderBy(asc(productPhotos.position));
	const { measurements_json, ...details } = row;
	return { ...details, measurements: JSON.parse(measurements_json ?? '{}'), photos };
}

export async function currentSlugFor(db: Database, oldSlug: string): Promise<string | null> {
	const row = await db
		.select({ slug: products.slug })
		.from(slugRedirects)
		.innerJoin(products, eq(products.id, slugRedirects.productId))
		.where(and(eq(slugRedirects.oldSlug, oldSlug), eq(products.publicationState, 'published')))
		.get();
	return row?.slug ?? null;
}
