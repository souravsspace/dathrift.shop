import { and, eq, sql } from 'drizzle-orm';
import { normalizeCartIds } from '../cart/cart';
import type { Database } from '../db/client';
import { deliveryAreas, orderItems, orders, products } from '../db/schema';
import { normalizeShippingAddress } from '../shipping/quote';

const orderColumns = {
	id: orders.id,
	status_token: orders.statusToken,
	status: orders.status,
	subtotal_bdt: orders.subtotalBdt,
	shipping_bdt: orders.shippingBdt,
	total_bdt: orders.totalBdt,
	preview_only: orders.previewOnly,
	expires_at: orders.expiresAt
};

export type ReservedOrder = {
	id: string;
	status_token: string;
	status: 'pending_payment';
	subtotal_bdt: number;
	shipping_bdt: number;
	total_bdt: number;
	preview_only: boolean;
	expires_at: string;
};

async function orderForKey(db: Database, key: string) {
	return ((await db.select(orderColumns).from(orders).where(eq(orders.checkoutKey, key)).get()) ??
		null) as ReservedOrder | null;
}

// D1 triggers reserve each unit inside the batch; any unavailable unit rolls back the whole order.
export async function reserveCheckout(
	db: Database,
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
	const area = and(
		eq(deliveryAreas.districtKey, address.district),
		eq(deliveryAreas.areaKey, address.area),
		eq(deliveryAreas.active, true),
		allowPreview ? undefined : eq(deliveryAreas.previewOnly, false)
	);
	const areaValue = (column: typeof deliveryAreas.feeBdt | typeof deliveryAreas.previewOnly) =>
		sql`(SELECT ${column} FROM ${deliveryAreas} WHERE ${area})`;
	let result;
	try {
		result = await db.batch([
			// A missing or unapproved area yields NULL fees, so NOT NULL aborts the whole batch.
			db.insert(orders).values({
				id,
				statusToken: token,
				addressJson: JSON.stringify(address),
				shippingBdt: areaValue(deliveryAreas.feeBdt),
				totalBdt: areaValue(deliveryAreas.feeBdt),
				previewOnly: areaValue(deliveryAreas.previewOnly),
				checkoutKey
			}),
			...ids.map((productId) =>
				db.insert(orderItems).values({
					orderId: id,
					productId,
					priceBdt: sql`(SELECT ${products.priceBdt} FROM ${products} WHERE ${products.id} = ${productId})`
				})
			),
			db.select(orderColumns).from(orders).where(eq(orders.id, id))
		]);
	} catch (error) {
		const retried = checkoutKey && (await orderForKey(db, checkoutKey));
		if (retried) return retried;
		throw error;
	}
	const order = (result.at(-1) as ReservedOrder[])[0];
	if (!order || !Number.isSafeInteger(order.total_bdt)) throw new Error('Reservation unavailable');
	return order;
}
