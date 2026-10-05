import { env } from 'cloudflare:workers';
import { databaseFrom } from '../../../../../../lib/server/db/client';
import { markSoldExternally } from '../../../../../../lib/server/catalog/external-sale';
import { staffActorForRequest } from '../../../../../../lib/server/staff-auth';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };

export const POST: RequestHandler = async ({ request, params }) => {
	if (request.headers.get('Origin') !== new URL(request.url).origin)
		return new Response('Forbidden', { status: 403, headers });
	if (!request.headers.get('Content-Type')?.startsWith('application/json'))
		return new Response('Invalid request', { status: 415, headers });
	const actor = await staffActorForRequest(request, env, import.meta.env.DEV);
	if (!actor) return new Response('Forbidden', { status: 403, headers });
	let reason: unknown;
	try {
		reason = ((await request.json()) as { reason?: unknown }).reason;
	} catch {
		return new Response('Invalid sale', { status: 400, headers });
	}
	if (typeof reason !== 'string') return new Response('Invalid sale', { status: 400, headers });
	const db = databaseFrom(env);
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		return Response.json(await markSoldExternally(db, params.id, actor, reason), { headers });
	} catch (error) {
		if (error instanceof Error && error.message === 'Invalid sale')
			return new Response(error.message, { status: 400, headers });
		if (
			error instanceof Error &&
			/Unit unavailable|UNIQUE constraint failed|constraint failed/i.test(error.message)
		)
			return new Response('Unit unavailable', { status: 409, headers });
		return new Response('Catalog unavailable', { status: 503, headers });
	}
};
