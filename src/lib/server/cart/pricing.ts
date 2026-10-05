import { normalizeCartIds } from './cart';

type CartDb = {
	prepare(sql: string): {
		bind(id: string): { first(): Promise<Record<string, unknown> | null> };
	};
};

export async function repriceCart(input: unknown, db: CartDb) {
	const items: { id: string; slug: string; name: string; price_bdt: number }[] = [];
	const unavailable: string[] = [];
	let subtotal = 0;
	for (const id of normalizeCartIds(input)) {
		const row = await db
			.prepare(
				`SELECT p.slug, p.name, p.price_bdt, p.publication_state, i.state AS stock_state
				 FROM products AS p
				 JOIN inventory AS i ON i.product_id = p.id
				 WHERE p.id = ?`
			)
			.bind(id)
			.first();
		if (!row || row.publication_state !== 'published' || row.stock_state !== 'available') {
			unavailable.push(id);
			continue;
		}
		if (!Number.isSafeInteger(row.price_bdt) || (row.price_bdt as number) <= 0)
			throw new Error('Invalid server price');
		subtotal += row.price_bdt as number;
		if (!Number.isSafeInteger(subtotal)) throw new Error('Cart total overflow');
		items.push({
			id,
			slug: row.slug as string,
			name: row.name as string,
			price_bdt: row.price_bdt as number
		});
	}
	return { items, unavailable, subtotal_bdt: unavailable.length ? null : subtotal };
}
