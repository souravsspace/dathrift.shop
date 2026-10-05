import { env } from 'cloudflare:workers';
import { databaseFrom } from '../../../../lib/server/db/client';
import { quoteCheckout } from '../../../../lib/server/checkout/quote';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };

export const POST: RequestHandler = async ({ request }) => {
	if (request.headers.get('Origin') !== new URL(request.url).origin)
		return new Response('Forbidden', { status: 403, headers });
	if (!request.headers.get('Content-Type')?.startsWith('application/json'))
		return new Response('Invalid request', { status: 415, headers });
	const db = databaseFrom(env);
	if (!db) return new Response('Quote unavailable', { status: 503, headers });
	let input: { ids?: unknown; address?: unknown };
	try {
		input = await request.json();
	} catch {
		return new Response('Invalid request', { status: 400, headers });
	}
	try {
		return Response.json(await quoteCheckout(input?.ids, input?.address, db), { headers });
	} catch (error) {
		if (error instanceof Error && error.message === 'Cart unavailable')
			return new Response(error.message, { status: 409, headers });
		if (error instanceof Error && error.message === 'Unsupported area')
			return new Response(error.message, { status: 422, headers });
		if (error instanceof Error && ['Invalid cart', 'Invalid address'].includes(error.message))
			return new Response(error.message, { status: 400, headers });
		return new Response('Quote unavailable', { status: 503, headers });
	}
};
