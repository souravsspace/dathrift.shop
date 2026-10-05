import { env } from 'cloudflare:workers';
import { quoteCheckout } from '../../../lib/server/checkout/quote';
import { databaseFrom } from '../../../lib/server/db/client';
import { expireStaleOrders, startPayment } from '../../../lib/server/payments/checkout';
import { paymentProviderFor } from '../../../lib/server/payments/select';
import { reserveCheckout } from '../../../lib/server/reservation/reserve';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };
const text = (body: string, status: number) => new Response(body, { status, headers });

// Classifies a failed hold with a fresh quote so buyers see why, without exposing stock details.
async function holdFailure(
	db: Parameters<typeof quoteCheckout>[2],
	ids: unknown,
	address: unknown
) {
	try {
		await quoteCheckout(ids, address, db);
		return text('Cart unavailable', 409);
	} catch (error) {
		const message = error instanceof Error ? error.message : '';
		if (message === 'Cart unavailable') return text(message, 409);
		if (message === 'Unsupported area') return text(message, 422);
		if (['Invalid cart', 'Invalid address'].includes(message)) return text(message, 400);
		return text('Checkout unavailable', 503);
	}
}

export const POST: RequestHandler = async ({ request, url }) => {
	if (request.headers.get('Origin') !== url.origin) return text('Forbidden', 403);
	if (!request.headers.get('Content-Type')?.startsWith('application/json'))
		return text('Invalid request', 415);
	const db = databaseFrom(env);
	const provider = db && paymentProviderFor(env, db, import.meta.env.DEV);
	if (!db || !provider) return text('Checkout unavailable', 503);
	let input: { ids?: unknown; address?: unknown; checkout_key?: unknown };
	try {
		input = await request.json();
	} catch {
		return text('Invalid request', 400);
	}
	const key = typeof input?.checkout_key === 'string' ? input.checkout_key : null;
	try {
		await expireStaleOrders(db, provider);
	} catch {
		// Expiry is best effort; stale holds are retried on the next checkout or status read.
	}
	let order;
	try {
		order = await reserveCheckout(db, input?.ids, input?.address, import.meta.env.DEV, key);
	} catch (error) {
		if (error instanceof Error && ['Invalid cart', 'Invalid address'].includes(error.message))
			return text(error.message, 400);
		return holdFailure(db, input?.ids, input?.address);
	}
	try {
		const { redirectUrl } = await startPayment(
			db,
			provider,
			order,
			`${url.origin}/checkout/callback`
		);
		return Response.json(
			{ redirect_url: redirectUrl, status_url: `/orders/${order.status_token}` },
			{ headers }
		);
	} catch {
		return text('Payment unavailable', 503);
	}
};
