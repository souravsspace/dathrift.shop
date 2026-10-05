import { env } from 'cloudflare:workers';
import { databaseFrom } from '../../../../../lib/server/db/client';
import { getStaffProduct, updateDraftDetails } from '../../../../../lib/server/catalog/admin';
import { staffActorForRequest } from '../../../../../lib/server/staff-auth';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };

export const GET: RequestHandler = async ({ request, params }) => {
	if (!(await staffActorForRequest(request, env, import.meta.env.DEV)))
		return new Response('Forbidden', { status: 403, headers });
	const db = databaseFrom(env);
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		const product = await getStaffProduct(db, params.id);
		if (!product) return new Response('Not found', { status: 404, headers });
		return Response.json(product, { headers });
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
	const db = databaseFrom(env);
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
