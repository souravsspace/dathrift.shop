import { and, asc, count, desc, eq, gte, inArray, lte, min, max, sql, type SQL } from 'drizzle-orm';
import type { BrowseFilters, SortOrder } from '../../browse-query';
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
	brand: string | null;
	size_label: string | null;
	condition_notes: string | null;
	measurements: Record<string, number>;
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

export type { BrowseFilters, SortOrder } from '../../browse-query';

export const BROWSE_PAGE_SIZE = 24;
const MAX_PAGE = 50;
const FILTER_KEYS = [
	'q',
	'category',
	'size',
	'min_price',
	'max_price',
	'available',
	'sort',
	'chest_min',
	'chest_max',
	'waist_min',
	'waist_max',
	'page'
];

const wholeTaka = (value: string | null) => {
	const amount = Number(value);
	return value && Number.isSafeInteger(amount) && amount > 0 ? amount : undefined;
};

// Garment measurements are entered in half inches, so a search does the same.
const inches = (value: string | null) => {
	const amount = Number(value);
	return value && Number.isFinite(amount) && amount > 0 && amount <= 100
		? Math.round(amount * 2) / 2
		: undefined;
};

// Unknown or malformed values are dropped; any filter parameter marks the page as a variant.
export function browseFiltersFrom(params: URLSearchParams) {
	const filters: BrowseFilters = {};
	const query = params.get('q')?.trim().replace(/\s+/g, ' ').slice(0, 80);
	if (query) filters.query = query;
	const category = params.get('category');
	if (category && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category) && category.length <= 60)
		filters.category = category;
	const sizes = [
		...new Set(
			params
				.getAll('size')
				.map((size) => size.trim())
				.filter((size) => /^[A-Za-z0-9 ./-]{1,20}$/.test(size))
		)
	].slice(0, 12);
	if (sizes.length) filters.sizes = sizes;
	const minPrice = wholeTaka(params.get('min_price'));
	if (minPrice) filters.minPrice = minPrice;
	const maxPrice = wholeTaka(params.get('max_price'));
	if (maxPrice) filters.maxPrice = maxPrice;
	if (params.get('available') === '1') filters.availableOnly = true;
	const sort = params.get('sort');
	if (sort === 'price-asc' || sort === 'price-desc') filters.sort = sort;
	const ranges = {
		chestMin: 'chest_min',
		chestMax: 'chest_max',
		waistMin: 'waist_min',
		waistMax: 'waist_max'
	} as const;
	for (const [key, param] of Object.entries(ranges) as [keyof typeof ranges, string][]) {
		const value = inches(params.get(param));
		if (value) filters[key] = value;
	}
	const active = FILTER_KEYS.some((key) => params.has(key));
	return { filters, active };
}

export function browsePageFrom(params: URLSearchParams) {
	const page = Number(params.get('page'));
	return Number.isSafeInteger(page) && page > 1 ? Math.min(page, MAX_PAGE) : 1;
}

// Lower-cased and with LIKE wildcards escaped, so a search for "%" matches a literal percent.
const containing = (query: string) =>
	`%${query.toLowerCase().replace(/[\\%_]/g, (match) => `\\${match}`)}%`;

const measurement = (key: 'chest_in' | 'waist_in') =>
	sql<number>`json_extract(${products.measurementsJson}, ${`$.${key}`})`;

function browseWhere(filters: BrowseFilters): SQL | undefined {
	const pattern = filters.query ? containing(filters.query) : '';
	return and(
		eq(products.publicationState, 'published'),
		filters.category ? eq(products.category, filters.category) : undefined,
		filters.query
			? sql`(lower(${products.name}) LIKE ${pattern} ESCAPE '\\'
				OR lower(coalesce(${products.brand}, '')) LIKE ${pattern} ESCAPE '\\'
				OR lower(coalesce(${products.code}, '')) LIKE ${pattern} ESCAPE '\\')`
			: undefined,
		filters.sizes?.length ? inArray(products.sizeLabel, filters.sizes) : undefined,
		filters.minPrice ? gte(products.priceBdt, filters.minPrice) : undefined,
		filters.maxPrice ? lte(products.priceBdt, filters.maxPrice) : undefined,
		filters.availableOnly ? eq(inventory.state, 'available') : undefined,
		filters.chestMin ? gte(measurement('chest_in'), filters.chestMin) : undefined,
		filters.chestMax ? lte(measurement('chest_in'), filters.chestMax) : undefined,
		filters.waistMin ? gte(measurement('waist_in'), filters.waistMin) : undefined,
		filters.waistMax ? lte(measurement('waist_in'), filters.waistMax) : undefined
	);
}

const sortOrder = (sort: SortOrder = 'newest') =>
	sort === 'price-asc'
		? [asc(products.priceBdt), desc(products.createdAt), desc(products.id)]
		: sort === 'price-desc'
			? [desc(products.priceBdt), desc(products.createdAt), desc(products.id)]
			: [desc(products.createdAt), desc(products.id)];

export function parseMeasurements(json: string | null): Record<string, number> {
	try {
		const value: unknown = json ? JSON.parse(json) : {};
		if (!value || typeof value !== 'object') return {};
		return Object.fromEntries(
			Object.entries(value).filter(
				(entry): entry is [string, number] => typeof entry[1] === 'number'
			)
		);
	} catch {
		return {};
	}
}

export async function listPublicProducts(
	db: Database,
	filters: BrowseFilters = {},
	{ limit = 48, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<PublicListing[]> {
	const rows = await db
		.select({
			...publicColumns,
			brand: products.brand,
			size_label: products.sizeLabel,
			condition_notes: products.conditionNotes,
			measurements_json: products.measurementsJson,
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
		.where(browseWhere(filters))
		.orderBy(...sortOrder(filters.sort))
		.limit(limit)
		.offset(offset);
	return rows.map(({ measurements_json, ...row }) => ({
		...row,
		measurements: parseMeasurements(measurements_json)
	}));
}

export async function countPublicProducts(db: Database, filters: BrowseFilters = {}) {
	const row = await db
		.select({ total: count() })
		.from(products)
		.innerJoin(inventory, eq(inventory.productId, products.id))
		.where(browseWhere(filters))
		.get();
	return row?.total ?? 0;
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

export async function isProductPhoto(db: Database, key: string): Promise<boolean> {
	const row = await db
		.select({ productId: productPhotos.productId })
		.from(productPhotos)
		.where(eq(productPhotos.r2Key, key))
		.get();
	return Boolean(row);
}

const LETTER_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

/** Letter sizes small to large, then numeric sizes, then anything else alphabetically. */
export function sortSizes(sizes: string[]) {
	const rank = (size: string) => {
		const letter = LETTER_SIZES.indexOf(size.toUpperCase());
		if (letter >= 0) return [0, letter, ''] as const;
		const number = Number.parseFloat(size);
		if (Number.isFinite(number) && /^\d/.test(size)) return [1, number, ''] as const;
		return [2, 0, size.toLowerCase()] as const;
	};
	return [...sizes].sort((a, b) => {
		const [groupA, orderA, textA] = rank(a);
		const [groupB, orderB, textB] = rank(b);
		return groupA - groupB || orderA - orderB || textA.localeCompare(textB);
	});
}

export type CategoryFacet = {
	slug: string;
	name: string;
	measurement_set: 'top' | 'bottom' | 'none';
	count: number;
	photo_key: string | null;
	photo_alt: string | null;
};

export async function publicFacets(db: Database) {
	const published = eq(products.publicationState, 'published');
	// Each category shows the cover photo of its newest published piece.
	const newest = sql`(SELECT p.id FROM products p
		WHERE p.category = ${categories.slug} AND p.publication_state = 'published'
		ORDER BY p.created_at DESC, p.id DESC LIMIT 1)`;
	const [categoryRows, sizeRows, priceRow] = await Promise.all([
		db
			.select({
				slug: categories.slug,
				name: categories.name,
				measurement_set: categories.measurementSet,
				count: count(products.id)
			})
			.from(products)
			.innerJoin(categories, eq(categories.slug, products.category))
			.where(published)
			.groupBy(categories.slug)
			.orderBy(asc(categories.name)),
		db.selectDistinct({ value: products.sizeLabel }).from(products).where(published),
		db
			.select({ min: min(products.priceBdt), max: max(products.priceBdt) })
			.from(products)
			.where(published)
			.get()
	]);
	const covers = categoryRows.length
		? await db
				.select({
					category: categories.slug,
					photo_key: productPhotos.r2Key,
					photo_alt: productPhotos.altText
				})
				.from(categories)
				.innerJoin(
					productPhotos,
					and(eq(productPhotos.productId, newest), eq(productPhotos.position, 1))
				)
		: [];
	const categoryFacets: CategoryFacet[] = categoryRows.map((row) => {
		const cover = covers.find((item) => item.category === row.slug);
		return { ...row, photo_key: cover?.photo_key ?? null, photo_alt: cover?.photo_alt ?? null };
	});
	return {
		categories: categoryFacets,
		sizes: sortSizes(sizeRows.flatMap((row) => (row.value ? [row.value] : []))),
		price: { min: priceRow?.min ?? 0, max: priceRow?.max ?? 0 }
	};
}
