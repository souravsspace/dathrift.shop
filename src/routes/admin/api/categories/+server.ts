import { env } from 'cloudflare:workers';
import { createCategory, listCategories } from '../../../../lib/server/catalog/categories';
import { databaseFrom } from '../../../../lib/server/db/client';
import { staffActorForRequest } from '../../../../lib/server/staff-auth';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };

export const GET: RequestHandler = async ({ request }) => {
	if (!(await staffActorForRequest(request, env, import.meta.env.DEV)))
		return new Response('Forbidden', { status: 403, headers });
	const db = databaseFrom(env);
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		return Response.json(await listCategories(db), { headers });
	} catch {
		return new Response('Catalog unavailable', { status: 503, headers });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	if (request.headers.get('Origin') !== new URL(request.url).origin)
		return new Response('Forbidden', { status: 403, headers });
	if (!request.headers.get('Content-Type')?.startsWith('application/json'))
		return new Response('Invalid request', { status: 415, headers });
	if (!(await staffActorForRequest(request, env, import.meta.env.DEV)))
		return new Response('Forbidden', { status: 403, headers });
	let input: unknown;
	try {
		input = await request.json();
	} catch {
		return new Response('Invalid category', { status: 400, headers });
	}
	const db = databaseFrom(env);
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		return Response.json(await createCategory(db, input), { status: 201, headers });
	} catch (error) {
		const message = error instanceof Error ? error.message : '';
		if (message === 'Invalid category') return new Response(message, { status: 400, headers });
		if (message === 'Category exists') return new Response(message, { status: 409, headers });
		return new Response('Catalog unavailable', { status: 503, headers });
	}
};
