import { env } from 'cloudflare:workers';
import { databaseFrom } from '../../../lib/server/db/client';
import { statusTokenForPayment } from '../../../lib/server/orders/status';
import { verifyPayment, type CallbackHint } from '../../../lib/server/payments/checkout';
import { paymentProviderFor } from '../../../lib/server/payments/select';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };
const hints: Record<string, CallbackHint> = {
	success: 'success',
	failure: 'failure',
	cancel: 'cancel'
};

// The query string is only a hint; the order changes solely from the provider's own answer.
export const GET: RequestHandler = async ({ url }) => {
	const paymentId = url.searchParams.get('paymentID') ?? '';
	if (!/^[A-Za-z0-9]{1,100}$/.test(paymentId))
		return new Response('Invalid payment', { status: 400, headers });
	const db = databaseFrom(env);
	const provider = db && paymentProviderFor(env, db, import.meta.env.DEV);
	if (!db || !provider) return new Response('Checkout unavailable', { status: 503, headers });
	const token = await statusTokenForPayment(db, paymentId);
	if (!token) return new Response('Not found', { status: 404, headers });
	try {
		await verifyPayment(
			db,
			provider,
			paymentId,
			hints[url.searchParams.get('status') ?? ''] ?? null
		);
	} catch {
		// The status page re-reads the order; an unverified payment never shows as paid.
	}
	return new Response(null, { status: 303, headers: { ...headers, Location: `/orders/${token}` } });
};
