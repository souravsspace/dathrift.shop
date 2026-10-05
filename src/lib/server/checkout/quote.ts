import { normalizeCartIds } from '../cart/cart';
import { repriceCart } from '../cart/pricing';
import { quoteShipping } from '../shipping/quote';

type CheckoutDb = Parameters<typeof repriceCart>[1] & Parameters<typeof quoteShipping>[0];

export async function quoteCheckout(ids: unknown, address: unknown, db: CheckoutDb) {
	const productIds = normalizeCartIds(ids);
	if (!productIds.length) throw new Error('Cart unavailable');
	const cart = await repriceCart(productIds, db);
	if (cart.unavailable.length || cart.subtotal_bdt === null) throw new Error('Cart unavailable');
	const delivery = await quoteShipping(db, address);
	const total = cart.subtotal_bdt + delivery.fee_bdt;
	if (!Number.isSafeInteger(total)) throw new Error('Invalid total');
	return {
		items: cart.items,
		subtotal_bdt: cart.subtotal_bdt,
		shipping_bdt: delivery.fee_bdt,
		total_bdt: total,
		preview_only: delivery.preview_only
	};
}
