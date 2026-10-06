import { env } from 'cloudflare:workers';
import { databaseFrom } from '../../../../lib/server/db/client';
import {
	createDraft,
	listStaffProducts,
	type StaffStatus
} from '../../../../lib/server/catalog/admin';
import { staffActorForRequest } from '../../../../lib/server/staff-auth';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };

export const GET: RequestHandler = async ({ request }) => {
	const actor = await staffActorForRequest(request, env, import.meta.env.DEV);
	if (!actor) return new Response('Forbidden', { status: 403, headers });
	const db = databaseFrom(env);
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		const params = new URL(request.url).searchParams;
		const status = params.get('status');
		return Response.json(
			await listStaffProducts(db, {
				page: Number(params.get('page') ?? 1),
				query: (params.get('q') ?? '').slice(0, 100),
				status:
					status && ['draft', 'live', 'sold', 'held'].includes(status)
						? (status as StaffStatus)
						: 'all'
			}),
			{ headers }
		);
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
