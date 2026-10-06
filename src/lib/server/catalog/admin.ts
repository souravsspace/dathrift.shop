import { and, asc, count, desc, eq, isNull, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import {
	categories,
	externalSales,
	homeFeature,
	inventory,
	orderItems,
	productPhotos,
	products,
	slugRedirects
} from '../db/schema';
import { databaseErrorText } from '../db/errors';
import { MAX_PHOTOS, publicationErrors } from './publication';

type DraftInput = {
	slug: string;
	name: string;
	category: string;
	price_bdt: number;
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isCategorySlug = (value: unknown) =>
	typeof value === 'string' && value.length <= 60 && slugPattern.test(value);

// The category must exist; D1 enforces it with the products.category foreign key.
function catalogWriteError(error: unknown): Error {
	const text = databaseErrorText(error);
	if (/FOREIGN KEY constraint failed/.test(text))
		return new Error('Unknown category', { cause: error });
	if (/Slug unavailable|UNIQUE constraint failed: products\.slug/.test(text))
		return new Error('Slug unavailable', { cause: error });
	return error instanceof Error ? error : new Error('Catalog write failed');
}

function isDraftInput(value: unknown): value is DraftInput {
	if (!value || typeof value !== 'object') return false;
	const input = value as Record<string, unknown>;
	return (
		typeof input.slug === 'string' &&
		input.slug.length <= 160 &&
		slugPattern.test(input.slug) &&
		typeof input.name === 'string' &&
		input.name.trim().length > 0 &&
		input.name.length <= 160 &&
		isCategorySlug(input.category) &&
		Number.isSafeInteger(input.price_bdt) &&
		(input.price_bdt as number) > 0
	);
}

export async function createDraft(db: Database, input: unknown) {
	if (!isDraftInput(input)) throw new Error('Invalid draft');
	const id = crypto.randomUUID();
	try {
		await db.batch([
			db.insert(products).values({
				id,
				slug: input.slug,
				name: input.name.trim(),
				category: input.category,
				priceBdt: input.price_bdt
			}),
			db.insert(inventory).values({ productId: id, state: 'available' })
		]);
	} catch (error) {
		throw catalogWriteError(error);
	}
	return { id, slug: input.slug, publication_state: 'draft' as const };
}

type ProductDetails = {
	name: string;
	category: DraftInput['category'];
	price_bdt: number;
	brand: string | null;
	description: string | null;
	condition_notes: string | null;
	size_label: string | null;
	measurements_json: string | null;
	fit_note: string | null;
};

function isProductDetails(value: unknown): value is ProductDetails {
	if (!value || typeof value !== 'object') return false;
	const input = value as Record<string, unknown>;
	const optional = ['brand', 'description', 'condition_notes', 'size_label', 'fit_note'];
	if (
		!optional.every(
			(key) => input[key] === null || (typeof input[key] === 'string' && input[key].length <= 4000)
		)
	)
		return false;
	if (input.measurements_json !== null) {
		if (typeof input.measurements_json !== 'string' || input.measurements_json.length > 2000)
			return false;
		try {
			const parsed: unknown = JSON.parse(input.measurements_json);
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
		} catch {
			return false;
		}
	}
	return (
		typeof input.name === 'string' &&
		input.name.trim().length > 0 &&
		input.name.length <= 160 &&
		isCategorySlug(input.category) &&
		Number.isSafeInteger(input.price_bdt) &&
		(input.price_bdt as number) > 0
	);
}

// A positive measurement in whole or half inches, checked again inside the publish write.
const halfInch = (key: string) => {
	const path = `$.${key}`;
	const value = sql`json_extract(${products.measurementsJson}, ${path})`;
	return sql`(json_type(${products.measurementsJson}, ${path}) IN ('integer', 'real')
		AND ${value} > 0 AND ${value} * 2 = CAST(${value} * 2 AS INTEGER))`;
};

const availableUnit = (id: string) =>
	sql`EXISTS (SELECT 1 FROM ${inventory} WHERE ${inventory.productId} = ${id} AND ${inventory.state} = 'available')`;

// A unit held in someone's checkout must not change under them; every other piece stays editable.
const notHeld = (id: string) =>
	sql`NOT EXISTS (SELECT 1 FROM ${inventory} WHERE ${inventory.productId} = ${id} AND ${inventory.state} = 'reserved')`;

const notArchived = isNull(products.archivedAt);

// Drafts and live pieces are both editable. A live piece must stay complete, since buyers see it.
export async function updateProductDetails(db: Database, id: string, input: unknown) {
	if (!isProductDetails(input)) throw new Error('Invalid details');
	const current = await db
		.select({ publication_state: products.publicationState, stock_state: inventory.state })
		.from(products)
		.innerJoin(inventory, eq(inventory.productId, products.id))
		.where(and(eq(products.id, id), notArchived))
		.get();
	if (!current) throw new Error('Product not found');
	if (current.stock_state === 'reserved') throw new Error('Product held');
	if (current.publication_state === 'published') {
		const category = await db
			.select({ measurement_set: categories.measurementSet })
			.from(categories)
			.where(eq(categories.slug, input.category))
			.get();
		const photos = await db
			.select({ r2_key: productPhotos.r2Key })
			.from(productPhotos)
			.where(eq(productPhotos.productId, id));
		if (
			publicationErrors({ ...input, measurement_set: category?.measurement_set ?? null }, photos)
				.length
		)
			throw new Error('Incomplete product');
	}
	const result = await db
		.update(products)
		.set({
			name: input.name.trim(),
			category: input.category,
			priceBdt: input.price_bdt,
			brand: input.brand?.trim() || null,
			description: input.description?.trim() || null,
			conditionNotes: input.condition_notes?.trim() || null,
			sizeLabel: input.size_label?.trim() || null,
			measurementsJson: input.measurements_json,
			fitNote: input.fit_note?.trim() || null
		})
		.where(
			and(
				eq(products.id, id),
				eq(products.publicationState, current.publication_state),
				notArchived,
				notHeld(id)
			)
		)
		.catch((error: unknown) => {
			throw catalogWriteError(error);
		});
	// D1 counts trigger writes in meta.changes, so only zero means the row was not written.
	if (result.meta.changes === 0) throw new Error('Product changed; retry');
	return { id, publication_state: current.publication_state };
}

export async function publishProduct(db: Database, id: string) {
	const product = await db
		.select({
			name: products.name,
			measurement_set: categories.measurementSet,
			price_bdt: products.priceBdt,
			measurements_json: products.measurementsJson
		})
		.from(products)
		.innerJoin(inventory, eq(inventory.productId, products.id))
		.leftJoin(categories, eq(categories.slug, products.category))
		.where(
			and(
				eq(products.id, id),
				eq(products.publicationState, 'draft'),
				eq(inventory.state, 'available'),
				notArchived
			)
		)
		.get();
	if (!product) throw new Error('Draft not available');
	const photos = await db
		.select({ r2_key: productPhotos.r2Key })
		.from(productPhotos)
		.where(eq(productPhotos.productId, id))
		.orderBy(asc(productPhotos.position));
	if (publicationErrors(product, photos).length) throw new Error('Incomplete product');
	// Re-check every requirement in the write itself so a concurrent edit cannot publish a gap.
	const result = await db
		.update(products)
		.set({ publicationState: 'published' })
		.where(
			and(
				eq(products.id, id),
				eq(products.publicationState, 'draft'),
				availableUnit(id),
				sql`trim(${products.name}) != '' AND ${products.priceBdt} > 0
				 AND (SELECT count(*) FROM ${productPhotos} WHERE ${productPhotos.productId} = ${id}) BETWEEN 1 AND ${MAX_PHOTOS}
				 AND NOT EXISTS (SELECT 1 FROM ${productPhotos} WHERE ${productPhotos.productId} = ${id}
				   AND trim(${productPhotos.r2Key}) = '')
				 AND CASE (SELECT ${categories.measurementSet} FROM ${categories}
				   WHERE ${categories.slug} = ${products.category})
				 WHEN 'none' THEN 1
				 WHEN 'bottom' THEN ${halfInch('waist_in')} AND ${halfInch('inseam_in')}
				 WHEN 'top' THEN ${halfInch('chest_in')} AND ${halfInch('length_in')}
				 ELSE 0 END`
			)
		);
	if (result.meta.changes === 0) throw new Error('Draft changed; retry publication');
	return { id, publication_state: 'published' as const };
}

// Sold pieces may come down too; only a unit held in checkout keeps its page up.
export async function unpublishProduct(db: Database, id: string) {
	const result = await db
		.update(products)
		.set({ publicationState: 'draft' })
		.where(and(eq(products.id, id), eq(products.publicationState, 'published'), notHeld(id)));
	if (result.meta.changes > 0) return { id, publication_state: 'draft' as const };
	const stock = await db
		.select({ state: inventory.state })
		.from(inventory)
		.where(eq(inventory.productId, id))
		.get();
	throw new Error(stock?.state === 'reserved' ? 'Product held' : 'Product not available');
}

const staffColumns = {
	id: products.id,
	code: products.code,
	slug: products.slug,
	name: products.name,
	category: products.category,
	category_name: categories.name,
	measurement_set: categories.measurementSet,
	price_bdt: products.priceBdt,
	publication_state: products.publicationState,
	created_at: products.createdAt,
	stock_state: inventory.state,
	featured: sql<boolean>`${homeFeature.productId} IS NOT NULL`.mapWith(Boolean)
};

export const PAGE_SIZE = 20;

export type StaffStatus = 'draft' | 'live' | 'sold' | 'held';

// One state per piece, in the order staff act on them; matches the desk filter tabs.
const staffStatus = sql<StaffStatus>`CASE
	WHEN ${inventory.state} = 'reserved' THEN 'held'
	WHEN ${inventory.state} = 'sold' THEN 'sold'
	WHEN ${products.publicationState} = 'published' THEN 'live'
	ELSE 'draft' END`;

// Staff type plain text; % and _ must not act as wildcards.
export const containsText = (query: string) =>
	`%${query
		.trim()
		.toLowerCase()
		.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;

export async function listStaffProducts(
	db: Database,
	{
		page = 1,
		query = '',
		status = 'all'
	}: { page?: number; query?: string; status?: StaffStatus | 'all' } = {}
) {
	const pattern = containsText(query);
	const matches = and(
		notArchived,
		query.trim()
			? sql`(lower(${products.name}) LIKE ${pattern} ESCAPE '\\'
				OR lower(coalesce(${products.code}, '')) LIKE ${pattern} ESCAPE '\\'
				OR lower(${products.slug}) LIKE ${pattern} ESCAPE '\\')`
			: undefined,
		status === 'all' ? undefined : sql`${staffStatus} = ${status}`
	);
	const current = Math.max(1, Math.floor(page) || 1);
	const [items, totals, statusRows] = await Promise.all([
		db
			.select({
				...staffColumns,
				size_label: products.sizeLabel,
				cover_key: sql<string | null>`(SELECT ${productPhotos.r2Key} FROM ${productPhotos}
					WHERE ${productPhotos.productId} = ${products.id} AND ${productPhotos.position} = 1)`
			})
			.from(products)
			.innerJoin(inventory, eq(inventory.productId, products.id))
			.leftJoin(categories, eq(categories.slug, products.category))
			.leftJoin(homeFeature, eq(homeFeature.productId, products.id))
			.where(matches)
			.orderBy(desc(products.createdAt), desc(products.id))
			.limit(PAGE_SIZE)
			.offset((current - 1) * PAGE_SIZE),
		db
			.select({ total: count() })
			.from(products)
			.innerJoin(inventory, eq(inventory.productId, products.id))
			.where(matches),
		db
			.select({ status: staffStatus, total: count() })
			.from(products)
			.innerJoin(inventory, eq(inventory.productId, products.id))
			.where(notArchived)
			.groupBy(staffStatus)
	]);
	const counts: Record<StaffStatus, number> = { draft: 0, live: 0, sold: 0, held: 0 };
	for (const row of statusRows) counts[row.status] = row.total;
	return { items, total: totals[0]?.total ?? 0, page: current, page_size: PAGE_SIZE, counts };
}

export async function getStaffProduct(db: Database, id: string) {
	const product = await db
		.select({
			...staffColumns,
			brand: products.brand,
			description: products.description,
			condition_notes: products.conditionNotes,
			size_label: products.sizeLabel,
			measurements_json: products.measurementsJson,
			fit_note: products.fitNote,
			has_history: sql<boolean>`(${inventory.state} = 'sold'
				OR EXISTS (SELECT 1 FROM ${orderItems} WHERE ${orderItems.productId} = ${products.id})
				OR EXISTS (SELECT 1 FROM ${externalSales} WHERE ${externalSales.productId} = ${products.id}))`.mapWith(
				Boolean
			)
		})
		.from(products)
		.innerJoin(inventory, eq(inventory.productId, products.id))
		.leftJoin(categories, eq(categories.slug, products.category))
		.leftJoin(homeFeature, eq(homeFeature.productId, products.id))
		.where(and(eq(products.id, id), notArchived))
		.get();
	if (!product) return null;
	const photos = await db
		.select({
			position: productPhotos.position,
			r2_key: productPhotos.r2Key,
			alt_text: productPhotos.altText
		})
		.from(productPhotos)
		.where(eq(productPhotos.productId, id))
		.orderBy(asc(productPhotos.position));
	return { ...product, photos };
}

// A draft slug changes freely. A live URL keeps its old slug as a permanent redirect, never reused.
export async function changeSlug(db: Database, id: string, slug: string) {
	if (slug.length > 160 || !slugPattern.test(slug)) throw new Error('Invalid slug');
	const current = await db
		.select({ slug: products.slug, publication_state: products.publicationState })
		.from(products)
		.where(eq(products.id, id))
		.get();
	if (!current) throw new Error('Product not found');
	if (current.slug === slug) return { id, slug };
	if (current.publication_state === 'draft') {
		const result = await db
			.update(products)
			.set({ slug })
			.where(and(eq(products.id, id), eq(products.publicationState, 'draft')))
			.catch((error: unknown) => {
				throw catalogWriteError(error);
			});
		if (result.meta.changes === 0) throw new Error('Product not found');
		return { id, slug };
	}
	try {
		await db.batch([
			db.insert(slugRedirects).values({ oldSlug: current.slug, productId: id }),
			db
				.update(products)
				.set({ slug })
				.where(and(eq(products.id, id), eq(products.slug, current.slug)))
		]);
	} catch (error) {
		if (/Slug unavailable|UNIQUE constraint failed/.test(databaseErrorText(error)))
			throw new Error('Slug unavailable', { cause: error });
		throw error;
	}
	return { id, slug };
}

type PhotoStore = { delete(key: string): Promise<unknown> };

// A piece that never sold or entered an order is deleted with its photos. Anything with sales or
// order history is archived instead: hidden from the shop and the desk, its records kept intact.
export async function removeProduct(db: Database, bucket: PhotoStore, id: string) {
	const product = await getStaffProduct(db, id);
	if (!product) throw new Error('Product not found');
	if (product.stock_state === 'reserved') throw new Error('Product held');
	const unfeature = db.delete(homeFeature).where(eq(homeFeature.productId, id));
	if (product.has_history) {
		const [, archived] = await db.batch([
			unfeature,
			db
				.update(products)
				.set({ archivedAt: sql`CURRENT_TIMESTAMP`, publicationState: 'draft' })
				.where(and(eq(products.id, id), notArchived, notHeld(id)))
		]);
		if (archived.meta.changes === 0) throw new Error('Product changed; retry');
		return { outcome: 'archived' as const };
	}
	// The inventory delete only matches an available unit, so a checkout that grabs the piece
	// mid-way leaves the product row referenced and the whole batch fails instead.
	await db.batch([
		unfeature,
		db.delete(slugRedirects).where(eq(slugRedirects.productId, id)),
		db.delete(productPhotos).where(eq(productPhotos.productId, id)),
		db.delete(inventory).where(and(eq(inventory.productId, id), eq(inventory.state, 'available'))),
		db.delete(products).where(eq(products.id, id))
	]);
	// The rows are gone, so the photos are already unreachable; a failed cleanup only leaves an orphan.
	await Promise.allSettled(product.photos.map((photo) => bucket.delete(photo.r2_key)));
	return { outcome: 'deleted' as const };
}
