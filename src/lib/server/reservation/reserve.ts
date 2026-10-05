import { normalizeCartIds } from '../cart/cart';
import { normalizeShippingAddress } from '../shipping/quote';

type Statement = { first(): Promise<Record<string, unknown> | null> };
type ReservationDb = {
	prepare(sql: string): { bind(...values: (string | number | null)[]): Statement };
	batch(statements: Statement[]): Promise<({ results?: Record<string, unknown>[] } | unknown)[]>;
};

export type ReservedOrder = {
	id: string;
	status_token: string;
	status: 'pending_payment';
	subtotal_bdt: number;
	shipping_bdt: number;
	total_bdt: number;
	preview_only: number;
	expires_at: string;
};

const orderColumns = `id, status_token, status, subtotal_bdt, shipping_bdt,
			 total_bdt, preview_only, expires_at`;

async function orderForKey(db: ReservationDb, key: string) {
	return (await db
		.prepare(`SELECT ${orderColumns} FROM orders WHERE checkout_key = ?`)
		.bind(key)
		.first()) as ReservedOrder | null;
}

export async function reserveCheckout(
	db: ReservationDb,
	inputIds: unknown,
	inputAddress: unknown,
	allowPreview = false,
	checkoutKey: string | null = null
): Promise<ReservedOrder> {
	if (checkoutKey !== null && !/^[A-Za-z0-9-]{16,64}$/.test(checkoutKey))
		throw new Error('Invalid cart');
	if (checkoutKey) {
		const existing = await orderForKey(db, checkoutKey);
		if (existing) return existing;
	}
	const ids = normalizeCartIds(inputIds).sort();
	if (!ids.length || ids.length > 20) throw new Error('Invalid cart');
	const address = normalizeShippingAddress(inputAddress);
	const id = crypto.randomUUID();
	const token = crypto.randomUUID();
	const statements = [
		db
			.prepare(
				`INSERT INTO orders
			 (id, status_token, address_json, shipping_bdt, total_bdt, preview_only, checkout_key)
			 SELECT ?, ?, ?, fee_bdt, fee_bdt, preview_only, ? FROM delivery_areas
			 WHERE district_key = ? AND area_key = ? AND active = 1
			 AND (preview_only = 0 OR ? = 1)`
			)
			.bind(
				id,
				token,
				JSON.stringify(address),
				checkoutKey,
				address.district,
				address.area,
				allowPreview ? 1 : 0
			),
		...ids.map((productId) =>
			db
				.prepare(
					`INSERT INTO order_items (order_id, product_id, price_bdt)
			 VALUES (?, ?, (SELECT price_bdt FROM products WHERE id = ?))`
				)
				.bind(id, productId, productId)
		),
		db.prepare(`SELECT ${orderColumns} FROM orders WHERE id = ?`).bind(id)
	];
	let result;
	try {
		result = await db.batch(statements);
	} catch (error) {
		const retried = checkoutKey && (await orderForKey(db, checkoutKey));
		if (retried) return retried;
		throw error;
	}
	const order = (result.at(-1) as { results?: Record<string, unknown>[] })?.results?.[0];
	if (!order || !Number.isSafeInteger(order.total_bdt)) throw new Error('Reservation unavailable');
	return order as ReservedOrder;
}
