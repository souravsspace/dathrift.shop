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
import { containsText } from '../catalog/admin';
import { orderReference } from './status';

const ORDER_PAGE_SIZE = 20;
const addressField = (field: string) =>
	sql<string>`json_extract(${orders.addressJson}, ${`$.${field}`})`;

// One box finds an order by its reference, the buyer's name, phone or address, or a piece in it.
function orderSearch(query: string) {
	const text = query.trim();
	if (!text) return undefined;
	const pattern = containsText(text);
	const digits = text.replace(/[\s-]/g, '').replace(/^\+880/, '0');
	const phonePattern = /^\+?\d{3,}$/.test(digits) ? containsText(digits) : null;
	return sql`(lower(${orders.id}) LIKE ${pattern} ESCAPE '\\'
		OR lower(${addressField('name')}) LIKE ${pattern} ESCAPE '\\'
		OR lower(${addressField('line1')}) LIKE ${pattern} ESCAPE '\\'
		OR lower(${addressField('district')}) LIKE ${pattern} ESCAPE '\\'
		OR lower(${addressField('area')}) LIKE ${pattern} ESCAPE '\\'
		OR lower(coalesce(${deliveryAreas.displayName}, '')) LIKE ${pattern} ESCAPE '\\'
		OR ${addressField('phone')} LIKE ${phonePattern ?? pattern} ESCAPE '\\'
		OR EXISTS (SELECT 1 FROM ${orderItems} AS search_items
			JOIN ${products} AS search_products ON search_products.id = search_items.product_id
			WHERE search_items.order_id = ${orders.id}
			AND (lower(search_products.name) LIKE ${pattern} ESCAPE '\\'
				OR lower(coalesce(search_products.code, '')) LIKE ${pattern} ESCAPE '\\')))`;
}

const areaJoin = and(
	eq(deliveryAreas.districtKey, addressField('district')),
	eq(deliveryAreas.areaKey, addressField('area'))
);

export async function listStaffOrders(
	db: Database,
	{ page = 1, query = '' }: { page?: number; query?: string } = {}
) {
	const where = orderSearch(query);
	const current = Math.max(1, Math.floor(page) || 1);
	const [rows, totals] = await Promise.all([
		db
			.select({
				id: orders.id,
				status: orders.status,
				total_bdt: orders.totalBdt,
				preview_only: orders.previewOnly,
				created_at: orders.createdAt,
				customer_name: addressField('name'),
				phone: addressField('phone'),
				area: deliveryAreas.displayName,
				item_count: sql<number>`(SELECT count(*) FROM ${orderItems}
					WHERE ${orderItems.orderId} = ${orders.id})`.mapWith(Number),
				fulfillment_state: fulfillments.state
			})
			.from(orders)
			.leftJoin(fulfillments, eq(fulfillments.orderId, orders.id))
			.leftJoin(deliveryAreas, areaJoin)
			.where(where)
			.orderBy(desc(orders.createdAt), desc(orders.id))
			.limit(ORDER_PAGE_SIZE)
			.offset((current - 1) * ORDER_PAGE_SIZE),
		db.select({ total: count() }).from(orders).leftJoin(deliveryAreas, areaJoin).where(where)
	]);
	return {
		items: rows.map((row) => ({ ...row, reference: orderReference(row.id) })),
		total: totals[0]?.total ?? 0,
		page: current,
		page_size: ORDER_PAGE_SIZE
	};
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
			.select({
				name: products.name,
				code: products.code,
				slug: products.slug,
				price_bdt: orderItems.priceBdt
			})
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

const fulfillmentStates = fulfillments.state.enumValues;

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
	const state = fulfillmentStates.find((value) => value === input.state);
	if (!state) throw new Error('Invalid fulfillment');
	const courier = clean(input.courier, 60);
	const trackingCode = clean(input.tracking_code, 100);
	if (state === 'dispatched' && !trackingCode) throw new Error('Invalid fulfillment');
	const values = {
		state,
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
		if (text.includes('Order not paid')) throw new Error('Order not paid', { cause: error });
		if (text.includes('Invalid fulfillment transition'))
			throw new Error('Invalid fulfillment transition', { cause: error });
		throw error;
	}
	return { order_id: orderId, state };
}
