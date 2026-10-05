import { and, asc, desc, eq, lte } from 'drizzle-orm';
import type { Database } from '../db/client';
import { categories, inventory, productPhotos, products } from '../db/schema';

export type PublicProduct = {
	id: string;
	slug: string;
	name: string;
	category: string;
	category_name: string;
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
	category_name: categories.name,
	price_bdt: products.priceBdt,
	stock_state: inventory.state
};

export type BrowseFilters = {
	category?: string;
	size?: string;
	maxPrice?: number;
	availableOnly?: boolean;
};

// Unknown or malformed values are dropped; any filter parameter marks the page as a variant.
export function browseFiltersFrom(params: URLSearchParams) {
	const filters: BrowseFilters = {};
	const category = params.get('category');
	if (category && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category) && category.length <= 60)
		filters.category = category;
	const size = params.get('size')?.trim();
	if (size && /^[A-Za-z0-9 ./-]{1,20}$/.test(size)) filters.size = size;
	const maxPrice = Number(params.get('max_price'));
	if (params.has('max_price') && Number.isSafeInteger(maxPrice) && maxPrice > 0)
		filters.maxPrice = maxPrice;
	if (params.get('available') === '1') filters.availableOnly = true;
	const active = ['category', 'size', 'max_price', 'available'].some((key) => params.has(key));
	return { filters, active };
}

export async function listPublicProducts(
	db: Database,
	filters: BrowseFilters = {}
): Promise<PublicListing[]> {
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
		.innerJoin(categories, eq(categories.slug, products.category))
		.leftJoin(
			productPhotos,
			and(eq(productPhotos.productId, products.id), eq(productPhotos.position, 1))
		)
		.where(
			and(
				eq(products.publicationState, 'published'),
				filters.category ? eq(products.category, filters.category) : undefined,
				filters.size ? eq(products.sizeLabel, filters.size) : undefined,
				filters.maxPrice ? lte(products.priceBdt, filters.maxPrice) : undefined,
				filters.availableOnly ? eq(inventory.state, 'available') : undefined
			)
		)
		.orderBy(desc(products.createdAt), desc(products.id))
		.limit(48);
}

export async function getPublicProduct(db: Database, slug: string): Promise<PublicProduct | null> {
	const row = await db
		.select(publicColumns)
		.from(products)
		.innerJoin(inventory, eq(inventory.productId, products.id))
		.innerJoin(categories, eq(categories.slug, products.category))
		.where(and(eq(products.slug, slug), eq(products.publicationState, 'published')))
		.get();
	return row ?? null;
}

export async function isPublishedPhoto(db: Database, key: string): Promise<boolean> {
	const row = await db
		.select({ productId: productPhotos.productId })
		.from(productPhotos)
		.innerJoin(products, eq(products.id, productPhotos.productId))
		.where(and(eq(productPhotos.r2Key, key), eq(products.publicationState, 'published')))
		.get();
	return Boolean(row);
}

export async function publicFacets(db: Database) {
	const published = eq(products.publicationState, 'published');
	const [categoryRows, sizeRows] = await Promise.all([
		db
			.selectDistinct({ slug: categories.slug, name: categories.name })
			.from(products)
			.innerJoin(categories, eq(categories.slug, products.category))
			.where(published)
			.orderBy(asc(categories.name)),
		db
			.selectDistinct({ value: products.sizeLabel })
			.from(products)
			.where(published)
			.orderBy(asc(products.sizeLabel))
	]);
	return {
		categories: categoryRows,
		sizes: sizeRows.flatMap((row) => (row.value ? [row.value] : []))
	};
}
