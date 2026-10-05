import { eq } from 'drizzle-orm';
import type { Database } from '../db/client';
import { inventory, products } from '../db/schema';
import { normalizeCartIds } from './cart';

export async function repriceCart(input: unknown, db: Database) {
	const items: { id: string; slug: string; name: string; price_bdt: number }[] = [];
	const unavailable: string[] = [];
	let subtotal = 0;
	for (const id of normalizeCartIds(input)) {
		const row = await db
			.select({
				slug: products.slug,
				name: products.name,
				price_bdt: products.priceBdt,
				publication_state: products.publicationState,
				stock_state: inventory.state
			})
			.from(products)
			.innerJoin(inventory, eq(inventory.productId, products.id))
			.where(eq(products.id, id))
			.get();
		if (!row || row.publication_state !== 'published' || row.stock_state !== 'available') {
			unavailable.push(id);
			continue;
		}
		if (!Number.isSafeInteger(row.price_bdt) || row.price_bdt <= 0)
			throw new Error('Invalid server price');
		subtotal += row.price_bdt;
		if (!Number.isSafeInteger(subtotal)) throw new Error('Cart total overflow');
		items.push({ id, slug: row.slug, name: row.name, price_bdt: row.price_bdt });
	}
	return { items, unavailable, subtotal_bdt: unavailable.length ? null : subtotal };
}
