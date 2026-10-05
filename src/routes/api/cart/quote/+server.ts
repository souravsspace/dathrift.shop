import { env } from 'cloudflare:workers';
import { databaseFrom } from '../../../../lib/server/db/client';
import { normalizeCartIds } from '../../../../lib/server/cart/cart';
import { repriceCart } from '../../../../lib/server/cart/pricing';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };

export const POST: RequestHandler = async ({ request }) => {
	let ids: string[];
	try {
		const body: unknown = await request.json();
		ids = normalizeCartIds(
			body && typeof body === 'object' && 'ids' in body ? body.ids : undefined
		);
	} catch {
		return new Response('Invalid cart', { status: 400, headers });
	}
	const db = databaseFrom(env);
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		return Response.json(await repriceCart(ids, db), { headers });
	} catch {
		return new Response('Catalog unavailable', { status: 503, headers });
	}
};
