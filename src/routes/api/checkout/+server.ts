import { env } from 'cloudflare:workers';
import { quoteCheckout } from '../../../lib/server/checkout/quote';
import { databaseFrom } from '../../../lib/server/db/client';
import { expireStaleOrders, startPayment } from '../../../lib/server/payments/checkout';
import { expireManualHolds, startManualPayment } from '../../../lib/server/payments/manual';
import { checkoutModeFor } from '../../../lib/server/payments/select';
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
	const mode = db && checkoutModeFor(env, db, import.meta.env.DEV);
	if (!db || !mode) return text('Checkout unavailable', 503);
	let input: { ids?: unknown; address?: unknown; checkout_key?: unknown };
	try {
		input = await request.json();
	} catch {
		return text('Invalid request', 400);
	}
	const key = typeof input?.checkout_key === 'string' ? input.checkout_key : null;
	try {
		if (mode.kind === 'gateway') await expireStaleOrders(db, mode.provider);
		await expireManualHolds(db);
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
	const statusUrl = `/orders/${order.status_token}`;
	if (mode.kind === 'manual') {
		// No payment page: the order page shows where to send money and takes the proof.
		try {
			await startManualPayment(db, order.id, mode.payTo);
			return Response.json({ status_url: statusUrl, manual: true }, { headers });
		} catch {
			return text('Payment unavailable', 503);
		}
	}
	try {
		const { redirectUrl } = await startPayment(
			db,
			mode.provider,
			order,
			`${url.origin}/checkout/callback`
		);
		return Response.json({ redirect_url: redirectUrl, status_url: statusUrl }, { headers });
	} catch {
		return text('Payment unavailable', 503);
	}
};
