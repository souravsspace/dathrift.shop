import { env } from 'cloudflare:workers';
import { databaseFrom } from '../../../../lib/server/db/client';
import { quoteShipping } from '../../../../lib/server/shipping/quote';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };

export const POST: RequestHandler = async ({ request }) => {
	if (request.headers.get('Origin') !== new URL(request.url).origin)
		return new Response('Forbidden', { status: 403, headers });
	if (!request.headers.get('Content-Type')?.startsWith('application/json'))
		return new Response('Invalid request', { status: 415, headers });
	const db = databaseFrom(env);
	if (!db) return new Response('Delivery lookup unavailable', { status: 503, headers });
	try {
		return Response.json(await quoteShipping(db, await request.json()), { headers });
	} catch (error) {
		if (error instanceof Error && error.message === 'Invalid address')
			return new Response(error.message, { status: 400, headers });
		if (error instanceof Error && error.message === 'Unsupported area')
			return new Response(error.message, { status: 422, headers });
		return new Response('Delivery lookup unavailable', { status: 503, headers });
	}
};
