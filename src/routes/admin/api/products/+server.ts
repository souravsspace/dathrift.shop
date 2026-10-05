import { env } from 'cloudflare:workers';
import { databaseFrom } from '../../../../lib/server/db/client';
import { createDraft, listStaffProducts } from '../../../../lib/server/catalog/admin';
import { staffActorForRequest } from '../../../../lib/server/staff-auth';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };

export const GET: RequestHandler = async ({ request }) => {
	const actor = await staffActorForRequest(request, env, import.meta.env.DEV);
	if (!actor) return new Response('Forbidden', { status: 403, headers });
	const db = databaseFrom(env);
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		return Response.json(await listStaffProducts(db), { headers });
	} catch {
		return new Response('Catalog unavailable', { status: 503, headers });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	if (request.headers.get('Origin') !== new URL(request.url).origin)
		return new Response('Forbidden', { status: 403, headers });
	if (!request.headers.get('Content-Type')?.startsWith('application/json'))
		return new Response('Invalid request', { status: 415, headers });
	const actor = await staffActorForRequest(request, env, import.meta.env.DEV);
	if (!actor) return new Response('Forbidden', { status: 403, headers });
	let input: unknown;
	try {
		input = await request.json();
	} catch {
		return new Response('Invalid draft', { status: 400, headers });
	}
	const db = databaseFrom(env);
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		return Response.json(await createDraft(db, input), { status: 201, headers });
	} catch (error) {
		const message = error instanceof Error ? error.message : '';
		if (message === 'Invalid draft' || message === 'Unknown category')
			return new Response(message, { status: 400, headers });
		if (message === 'Slug unavailable') return new Response(message, { status: 409, headers });
		return new Response('Catalog unavailable', { status: 503, headers });
	}
};
