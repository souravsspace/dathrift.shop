import { env } from 'cloudflare:workers';
import { updateDraftDetails } from '../../../../../lib/server/catalog/admin';
import { staffActorForRequest } from '../../../../../lib/server/staff-auth';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };

export const GET: RequestHandler = async ({ request, params }) => {
	if (!(await staffActorForRequest(request, env, import.meta.env.DEV)))
		return new Response('Forbidden', { status: 403, headers });
	const db = (env as { DB?: D1Database }).DB;
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		const product = await db
			.prepare(
				`SELECT p.*, i.state AS stock_state FROM products AS p
			 JOIN inventory AS i ON i.product_id = p.id WHERE p.id = ?`
			)
			.bind(params.id)
			.first();
		if (!product) return new Response('Not found', { status: 404, headers });
		const photos = await db
			.prepare(
				`SELECT position, r2_key, alt_text FROM product_photos
			 WHERE product_id = ? ORDER BY position`
			)
			.bind(params.id)
			.all();
		return Response.json({ ...product, photos: photos.results }, { headers });
	} catch {
		return new Response('Catalog unavailable', { status: 503, headers });
	}
};

export const PATCH: RequestHandler = async ({ request, params }) => {
	if (request.headers.get('Origin') !== new URL(request.url).origin)
		return new Response('Forbidden', { status: 403, headers });
	if (!request.headers.get('Content-Type')?.startsWith('application/json'))
		return new Response('Invalid request', { status: 415, headers });
	if (!(await staffActorForRequest(request, env, import.meta.env.DEV)))
		return new Response('Forbidden', { status: 403, headers });
	const db = (env as { DB?: Parameters<typeof updateDraftDetails>[0] }).DB;
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		return Response.json(await updateDraftDetails(db, params.id, await request.json()), {
			headers
		});
	} catch (error) {
		if (error instanceof Error && error.message === 'Invalid details')
			return new Response(error.message, { status: 400, headers });
		if (error instanceof Error && error.message === 'Draft not found')
			return new Response(error.message, { status: 404, headers });
		return new Response('Catalog unavailable', { status: 503, headers });
	}
};
