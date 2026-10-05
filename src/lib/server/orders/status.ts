import type { OrderStatus } from './lifecycle';

type StatusDb = {
	prepare(sql: string): {
		bind(...values: string[]): {
			first(): Promise<Record<string, unknown> | null>;
			all(): Promise<{ results: Record<string, unknown>[] }>;
		};
	};
};

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
};

export const orderReference = (orderId: string) => orderId.slice(0, 8).toUpperCase();

// The status token is the buyer's only credential; return nothing that identifies them.
export async function orderForStatusToken(
	db: StatusDb,
	token: string
): Promise<OrderSummary | null> {
	if (!/^[0-9a-f-]{36}$/.test(token)) return null;
	const order = await db
		.prepare(
			`SELECT o.id, o.status, o.subtotal_bdt, o.shipping_bdt, o.total_bdt, o.preview_only,
			        o.address_json, o.created_at, o.expires_at, a.display_name AS area,
			        f.state AS fulfillment_state, f.courier, f.tracking_code
			 FROM orders AS o
			 LEFT JOIN delivery_areas AS a
			   ON a.district_key = json_extract(o.address_json, '$.district')
			  AND a.area_key = json_extract(o.address_json, '$.area')
			 LEFT JOIN fulfillments AS f ON f.order_id = o.id
			 WHERE o.status_token = ?`
		)
		.bind(token)
		.first();
	if (!order) return null;
	const { results } = await db
		.prepare(
			`SELECT p.name, p.slug, oi.price_bdt FROM order_items AS oi
			 JOIN products AS p ON p.id = oi.product_id
			 WHERE oi.order_id = ? ORDER BY p.name`
		)
		.bind(order.id as string)
		.all();
	const phone = String((JSON.parse(order.address_json as string) as { phone: string }).phone);
	return {
		reference: orderReference(order.id as string),
		status: order.status as OrderStatus,
		subtotal_bdt: order.subtotal_bdt as number,
		shipping_bdt: order.shipping_bdt as number,
		total_bdt: order.total_bdt as number,
		preview_only: order.preview_only === 1,
		area: (order.area as string | null) ?? 'Delivery area',
		phone_hint: `${'•'.repeat(Math.max(phone.length - 3, 0))}${phone.slice(-3)}`,
		created_at: order.created_at as string,
		expires_at: order.expires_at as string,
		fulfillment: order.fulfillment_state
			? {
					state: order.fulfillment_state as string,
					courier: (order.courier as string | null) ?? null,
					tracking_code: (order.tracking_code as string | null) ?? null
				}
			: null,
		items: results as OrderSummary['items']
	};
}
