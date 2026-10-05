import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { categories, homeFeature, inventory, productPhotos, products } from '../db/schema';
import type { PublicListing } from './public-catalog';

export type HomeHero = PublicListing & { featured: boolean };

// The featured piece leads only while it is published and available; otherwise the newest
// available piece takes its place, so the hero never advertises something that cannot be bought.
export async function homeHero(db: Database): Promise<HomeHero | null> {
	const row = await db
		.select({
			id: products.id,
			slug: products.slug,
			name: products.name,
			category: products.category,
			category_name: categories.name,
			price_bdt: products.priceBdt,
			stock_state: inventory.state,
			size_label: products.sizeLabel,
			condition_notes: products.conditionNotes,
			photo_key: productPhotos.r2Key,
			photo_alt: productPhotos.altText,
			featured: sql<number>`${homeFeature.productId} IS NOT NULL`
		})
		.from(products)
		.innerJoin(inventory, eq(inventory.productId, products.id))
		.innerJoin(categories, eq(categories.slug, products.category))
		.leftJoin(
			productPhotos,
			and(eq(productPhotos.productId, products.id), eq(productPhotos.position, 1))
		)
		.leftJoin(homeFeature, eq(homeFeature.productId, products.id))
		.where(and(eq(products.publicationState, 'published'), eq(inventory.state, 'available')))
		.orderBy(asc(isNull(homeFeature.productId)), desc(products.createdAt), desc(products.id))
		.get();
	return row ? { ...row, featured: Boolean(row.featured) } : null;
}

export async function featureOnHome(db: Database, id: string) {
	const product = await db
		.select({ id: products.id })
		.from(products)
		.innerJoin(inventory, eq(inventory.productId, products.id))
		.where(
			and(
				eq(products.id, id),
				eq(products.publicationState, 'published'),
				eq(inventory.state, 'available')
			)
		)
		.get();
	if (!product) throw new Error('Product not available');
	await db
		.insert(homeFeature)
		.values({ slot: 'hero', productId: id })
		.onConflictDoUpdate({
			target: homeFeature.slot,
			set: { productId: id, featuredAt: sql`CURRENT_TIMESTAMP` }
		});
	return { id, featured: true };
}

export async function clearHomeFeature(db: Database) {
	await db.delete(homeFeature).where(eq(homeFeature.slot, 'hero'));
	return { featured: false };
}
