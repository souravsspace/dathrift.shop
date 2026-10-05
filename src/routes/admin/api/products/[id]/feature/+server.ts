import { env } from 'cloudflare:workers';
import { clearHomeFeature, featureOnHome } from '../../../../../../lib/server/catalog/feature';
import { databaseFrom } from '../../../../../../lib/server/db/client';
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
	let featured: unknown;
	try {
		featured = ((await request.json()) as { featured?: unknown }).featured;
	} catch {
		return new Response('Invalid request', { status: 400, headers });
	}
	if (typeof featured !== 'boolean')
		return new Response('Invalid request', { status: 400, headers });
	const db = databaseFrom(env);
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		return Response.json(
			featured ? await featureOnHome(db, params.id) : await clearHomeFeature(db),
			{ headers }
		);
	} catch (error) {
		if (error instanceof Error && error.message === 'Product not available')
			return new Response(error.message, { status: 409, headers });
		return new Response('Catalog unavailable', { status: 503, headers });
	}
};
