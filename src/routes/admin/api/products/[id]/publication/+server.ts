import { env } from 'cloudflare:workers';
import { databaseFrom } from '../../../../../../lib/server/db/client';
import { publishProduct, unpublishProduct } from '../../../../../../lib/server/catalog/admin';
import { staffActorForRequest } from '../../../../../../lib/server/staff-auth';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };

export const POST: RequestHandler = async ({ request, params }) => {
	if (request.headers.get('Origin') !== new URL(request.url).origin)
		return new Response('Forbidden', { status: 403, headers });
	if (!request.headers.get('Content-Type')?.startsWith('application/json'))
		return new Response('Invalid request', { status: 415, headers });
	if (!(await staffActorForRequest(request, env, import.meta.env.DEV)))
		return new Response('Forbidden', { status: 403, headers });
	let state: unknown;
	try {
		state = ((await request.json()) as { state?: unknown }).state;
	} catch {
		return new Response('Invalid request', { status: 400, headers });
	}
	if (state !== 'published' && state !== 'draft')
		return new Response('Invalid state', { status: 400, headers });
	const db = databaseFrom(env);
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		return Response.json(
			state === 'published'
				? await publishProduct(db, params.id)
				: await unpublishProduct(db, params.id),
			{ headers }
		);
	} catch (error) {
		if (error instanceof Error && error.message === 'Incomplete product')
			return new Response(error.message, { status: 422, headers });
		if (
			error instanceof Error &&
			['Draft not available', 'Product not available', 'Draft changed; retry publication'].includes(
				error.message
			)
		)
			return new Response(error.message, { status: 409, headers });
		return new Response('Catalog unavailable', { status: 503, headers });
	}
};
