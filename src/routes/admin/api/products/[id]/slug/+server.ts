import { env } from 'cloudflare:workers';
import { changeSlug } from '../../../../../../lib/server/catalog/admin';
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
	let slug: unknown;
	try {
		slug = ((await request.json()) as { slug?: unknown }).slug;
	} catch {
		return new Response('Invalid slug', { status: 400, headers });
	}
	if (typeof slug !== 'string') return new Response('Invalid slug', { status: 400, headers });
	const db = databaseFrom(env);
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		return Response.json(await changeSlug(db, params.id, slug), { headers });
	} catch (error) {
		const message = error instanceof Error ? error.message : '';
		if (message === 'Invalid slug') return new Response(message, { status: 400, headers });
		if (message === 'Product not found') return new Response(message, { status: 404, headers });
		if (message === 'Slug unavailable') return new Response(message, { status: 409, headers });
		return new Response('Catalog unavailable', { status: 503, headers });
	}
};
