// A buyer's orders, remembered only in this browser so they can find their order pages again.
// Nothing here is sent to the server; the status token in each link is the buyer's own key.
const key = 'dathrift-orders';
const LIMIT = 30;

type OrderStorage = Pick<Storage, 'getItem' | 'setItem'>;

export type SavedOrder = {
	token: string;
	reference: string;
	status: string;
	total_bdt: number;
	items: { name: string; slug: string }[];
	created_at: string;
};

const isOrder = (value: unknown): value is SavedOrder => {
	if (!value || typeof value !== 'object') return false;
	const order = value as Record<string, unknown>;
	return (
		typeof order.token === 'string' &&
		/^[0-9a-f-]{36}$/.test(order.token) &&
		typeof order.reference === 'string' &&
		typeof order.status === 'string' &&
		typeof order.total_bdt === 'number' &&
		typeof order.created_at === 'string' &&
		Array.isArray(order.items) &&
		order.items.every(
			(item) => item && typeof item.name === 'string' && typeof item.slug === 'string'
		)
	);
};

export function readSavedOrders(storage: OrderStorage): SavedOrder[] {
	try {
		const value: unknown = JSON.parse(storage.getItem(key) ?? '[]');
		if (!Array.isArray(value)) return [];
		return value
			.filter(isOrder)
			.sort((a, b) => b.created_at.localeCompare(a.created_at))
			.slice(0, LIMIT);
	} catch {
		return [];
	}
}

/** Adds the order, or refreshes the copy already saved for the same order link. */
export function saveOrder(storage: OrderStorage, order: SavedOrder): SavedOrder[] {
	const saved = readSavedOrders(storage);
	const earlier = saved.find((item) => item.token === order.token);
	const next = { ...order, reference: order.reference || earlier?.reference || '' };
	const orders = [next, ...saved.filter((item) => item.token !== order.token)]
		.sort((a, b) => b.created_at.localeCompare(a.created_at))
		.slice(0, LIMIT);
	try {
		storage.setItem(key, JSON.stringify(orders));
	} catch {
		// Storage full or blocked: the order page link still works, it just is not remembered.
	}
	return orders;
}
