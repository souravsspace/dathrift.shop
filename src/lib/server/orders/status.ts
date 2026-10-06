import { and, asc, eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import {
	deliveryAreas,
	fulfillments,
	manualPayments,
	orderItems,
	orders,
	payments,
	products
} from '../db/schema';
import type { OrderStatus } from './lifecycle';

export type OrderSummary = {
	reference: string;
	status: OrderStatus;
	subtotal_bdt: number;
	shipping_bdt: number;
	total_bdt: number;
	preview_only: boolean;
	area: string;
	phone_hint: string;
	created_at: string;
	expires_at: string;
	fulfillment: { state: string; courier: string | null; tracking_code: string | null } | null;
	items: { name: string; slug: string; price_bdt: number }[];
	/** Manual bKash Send Money: where to pay and, once sent, what the buyer reported. */
	manual: {
		pay_to: string;
		plan: 'full' | 'delivery' | null;
		amount_bdt: number | null;
		trx_id: string | null;
		sender_hint: string | null;
		submitted_at: string | null;
	} | null;
};

const hint = (phone: string) => `${'•'.repeat(Math.max(phone.length - 3, 0))}${phone.slice(-3)}`;

export const orderReference = (orderId: string) => orderId.slice(0, 8).toUpperCase();

// The status token is the buyer's only credential; return nothing that identifies them.
export async function orderForStatusToken(
	db: Database,
	token: string
): Promise<OrderSummary | null> {
	if (!/^[0-9a-f-]{36}$/.test(token)) return null;
	const order = await db
		.select({
			id: orders.id,
			status: orders.status,
			subtotal: orders.subtotalBdt,
			shipping: orders.shippingBdt,
			total: orders.totalBdt,
			previewOnly: orders.previewOnly,
			phone: sql<string>`json_extract(${orders.addressJson}, '$.phone')`,
			createdAt: orders.createdAt,
			expiresAt: orders.expiresAt,
			area: deliveryAreas.displayName,
			fulfillmentState: fulfillments.state,
			courier: fulfillments.courier,
			trackingCode: fulfillments.trackingCode,
			payTo: manualPayments.payTo,
			plan: manualPayments.plan,
			paidAmount: manualPayments.amountBdt,
			trxId: manualPayments.trxId,
			sender: manualPayments.senderNumber,
			submittedAt: manualPayments.submittedAt
		})
		.from(orders)
		.leftJoin(
			deliveryAreas,
			and(
				eq(deliveryAreas.districtKey, sql`json_extract(${orders.addressJson}, '$.district')`),
				eq(deliveryAreas.areaKey, sql`json_extract(${orders.addressJson}, '$.area')`)
			)
		)
		.leftJoin(fulfillments, eq(fulfillments.orderId, orders.id))
		.leftJoin(manualPayments, eq(manualPayments.orderId, orders.id))
		.where(eq(orders.statusToken, token))
		.get();
	if (!order) return null;
	const items = await db
		.select({ name: products.name, slug: products.slug, price_bdt: orderItems.priceBdt })
		.from(orderItems)
		.innerJoin(products, eq(products.id, orderItems.productId))
		.where(eq(orderItems.orderId, order.id))
		.orderBy(asc(products.name));
	const phone = String(order.phone);
	return {
		reference: orderReference(order.id),
		status: order.status,
		subtotal_bdt: order.subtotal,
		shipping_bdt: order.shipping,
		total_bdt: order.total,
		preview_only: order.previewOnly,
		area: order.area ?? 'Delivery area',
		phone_hint: hint(phone),
		created_at: order.createdAt,
		expires_at: order.expiresAt,
		fulfillment: order.fulfillmentState
			? {
					state: order.fulfillmentState,
					courier: order.courier,
					tracking_code: order.trackingCode
				}
			: null,
		items,
		manual: order.payTo
			? {
					pay_to: order.payTo,
					plan: order.plan,
					amount_bdt: order.paidAmount,
					trx_id: order.trxId,
					sender_hint: order.sender ? hint(order.sender) : null,
					submitted_at: order.submittedAt
				}
			: null
	};
}

export async function statusTokenForPayment(db: Database, paymentId: string) {
	const row = await db
		.select({ token: orders.statusToken })
		.from(payments)
		.innerJoin(orders, eq(orders.id, payments.orderId))
		.where(eq(payments.paymentId, paymentId))
		.get();
	return row?.token ?? null;
}
