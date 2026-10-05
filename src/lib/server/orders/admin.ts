import { and, asc, count, desc, eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { databaseErrorText } from '../db/errors';
import {
	deliveryAreas,
	fulfillments,
	orderEvents,
	orderItems,
	orders,
	payments,
	products
} from '../db/schema';
import { orderReference } from './status';

export async function listStaffOrders(db: Database) {
	const rows = await db
		.select({
			id: orders.id,
			status: orders.status,
			total_bdt: orders.totalBdt,
			preview_only: orders.previewOnly,
			created_at: orders.createdAt,
			item_count: count(orderItems.productId),
			fulfillment_state: fulfillments.state
		})
		.from(orders)
		.leftJoin(orderItems, eq(orderItems.orderId, orders.id))
		.leftJoin(fulfillments, eq(fulfillments.orderId, orders.id))
		.groupBy(orders.id)
		.orderBy(desc(orders.createdAt), desc(orders.id))
		.limit(100);
	return rows.map((row) => ({ ...row, reference: orderReference(row.id) }));
}

export async function getStaffOrder(db: Database, id: string) {
	const order = await db
		.select({
			id: orders.id,
			status: orders.status,
			address_json: orders.addressJson,
			subtotal_bdt: orders.subtotalBdt,
			shipping_bdt: orders.shippingBdt,
			total_bdt: orders.totalBdt,
			preview_only: orders.previewOnly,
			created_at: orders.createdAt,
			expires_at: orders.expiresAt,
			area: deliveryAreas.displayName
		})
		.from(orders)
		.leftJoin(
			deliveryAreas,
			and(
				eq(deliveryAreas.districtKey, sql`json_extract(${orders.addressJson}, '$.district')`),
				eq(deliveryAreas.areaKey, sql`json_extract(${orders.addressJson}, '$.area')`)
			)
		)
		.where(eq(orders.id, id))
		.get();
	if (!order) return null;
	const [items, payment, fulfillment, events] = await Promise.all([
		db
			.select({ name: products.name, slug: products.slug, price_bdt: orderItems.priceBdt })
			.from(orderItems)
			.innerJoin(products, eq(products.id, orderItems.productId))
			.where(eq(orderItems.orderId, id))
			.orderBy(asc(products.name)),
		db
			.select({
				provider: payments.provider,
				payment_id: payments.paymentId,
				status: payments.status,
				trx_id: payments.trxId,
				amount_bdt: payments.amountBdt,
				updated_at: payments.updatedAt
			})
			.from(payments)
			.where(eq(payments.orderId, id))
			.get(),
		db
			.select({
				state: fulfillments.state,
				courier: fulfillments.courier,
				tracking_code: fulfillments.trackingCode,
				updated_at: fulfillments.updatedAt
			})
			.from(fulfillments)
			.where(eq(fulfillments.orderId, id))
			.get(),
		db
			.select({
				actor: orderEvents.actor,
				action: orderEvents.action,
				note: orderEvents.note,
				created_at: orderEvents.createdAt
			})
			.from(orderEvents)
			.where(eq(orderEvents.orderId, id))
			.orderBy(asc(orderEvents.id))
	]);
	const { address_json, ...rest } = order;
	return {
		...rest,
		reference: orderReference(id),
		address: JSON.parse(address_json) as {
			name: string;
			phone: string;
			line1: string;
			district: string;
			area: string;
		},
		items,
		payment: payment ?? null,
		fulfillment: fulfillment ?? null,
		events
	};
}

type FulfillmentInput = {
	state: string;
	courier?: string | null;
	tracking_code?: string | null;
};

const clean = (value: string | null | undefined, max: number) => {
	const trimmed = value?.trim() ?? '';
	if (trimmed.length > max) throw new Error('Invalid fulfillment');
	return trimmed || null;
};

// Fulfillment never touches payment state; D1 triggers keep it paid-only and forward-only.
export async function recordFulfillment(
	db: Database,
	orderId: string,
	actor: string,
	input: FulfillmentInput
) {
	if (input.state !== 'preparing' && input.state !== 'dispatched' && input.state !== 'delivered')
		throw new Error('Invalid fulfillment');
	const courier = clean(input.courier, 60);
	const trackingCode = clean(input.tracking_code, 100);
	if (input.state === 'dispatched' && !trackingCode) throw new Error('Invalid fulfillment');
	const values = {
		state: input.state,
		courier,
		trackingCode,
		actorEmail: actor,
		updatedAt: sql`CURRENT_TIMESTAMP`
	};
	try {
		await db
			.insert(fulfillments)
			.values({ orderId, ...values })
			.onConflictDoUpdate({
				target: fulfillments.orderId,
				set: {
					...values,
					courier: courier ?? sql`${fulfillments.courier}`,
					trackingCode: trackingCode ?? sql`${fulfillments.trackingCode}`
				}
			});
	} catch (error) {
		const text = databaseErrorText(error);
		if (text.includes('Order not paid')) throw new Error('Order not paid');
		if (text.includes('Invalid fulfillment transition'))
			throw new Error('Invalid fulfillment transition');
		throw error;
	}
	return { order_id: orderId, state: input.state };
}
