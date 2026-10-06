// One plain stage per order, in the words staff act on. Payment status comes from bKash
// verification, or from staff checking a manual bKash Send Money in the bKash app; fulfillment
// only moves a paid order along.
export type OrderStatus = 'pending_payment' | 'paid' | 'payment_review' | 'cancelled' | 'expired';
export type FulfillmentState = 'preparing' | 'dispatched' | 'delivered';
export type OrderStage =
	'review' | 'awaiting' | 'to_ship' | 'dispatched' | 'delivered' | 'closed' | 'expired';
// The orders list tabs; "shipped" covers dispatched and delivered.
export const ORDER_FILTERS = ['review', 'to_ship', 'shipped', 'awaiting', 'closed'] as const;
export type OrderFilter = (typeof ORDER_FILTERS)[number];

export function orderStage(status: string, fulfillment: string | null | undefined): OrderStage {
	if (status === 'payment_review') return 'review';
	if (status === 'pending_payment') return 'awaiting';
	if (status === 'expired') return 'expired';
	if (status !== 'paid') return 'closed';
	if (fulfillment === 'dispatched') return 'dispatched';
	if (fulfillment === 'delivered') return 'delivered';
	return 'to_ship';
}

export const stageLabels: Record<OrderStage, string> = {
	review: 'Check payment',
	awaiting: 'Awaiting payment',
	to_ship: 'Paid · to ship',
	dispatched: 'Dispatched',
	delivered: 'Delivered',
	closed: 'Closed',
	expired: 'Hold expired'
};

export const filterLabels: Record<OrderFilter, string> = {
	review: 'Needs review',
	to_ship: 'To ship',
	shipped: 'Shipped',
	awaiting: 'Awaiting payment',
	closed: 'Closed'
};

const eventLabels: Record<string, string> = {
	pending_payment: 'Order placed, waiting for payment',
	paid: 'Payment verified with bKash',
	payment_review: 'Waiting for a payment check',
	manual_payment_sent: 'Buyer reported a bKash payment',
	manual_payment_confirmed: 'bKash payment found and confirmed',
	manual_payment_rejected: 'bKash payment not found, order closed',
	closed_by_staff: 'Closed by staff',
	cancelled: 'Order closed, pieces released',
	expired: 'Hold expired, pieces released',
	fulfillment_preparing: 'Preparing the parcel',
	fulfillment_dispatched: 'Dispatched to the courier',
	fulfillment_delivered: 'Delivered'
};

export const eventLabel = (action: string) =>
	eventLabels[action] ?? action.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase());

export const actorLabel = (actor: string | null) =>
	!actor || actor === 'system'
		? 'System'
		: actor === 'local-preview'
			? 'Local preview'
			: actor === 'buyer'
				? 'Buyer'
				: actor;
