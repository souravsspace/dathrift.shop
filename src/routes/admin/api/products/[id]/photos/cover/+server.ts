import { env } from 'cloudflare:workers';
import { makeCoverPhoto } from '../../../../../../../lib/server/catalog/photos';
import { databaseFrom } from '../../../../../../../lib/server/db/client';
import { staffActorForRequest } from '../../../../../../../lib/server/staff-auth';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };

export const POST: RequestHandler = async ({ request, params }) => {
	if (request.headers.get('Origin') !== new URL(request.url).origin)
		return new Response('Forbidden', { status: 403, headers });
	if (!request.headers.get('Content-Type')?.startsWith('application/json'))
		return new Response('Invalid request', { status: 415, headers });
	if (!(await staffActorForRequest(request, env, import.meta.env.DEV)))
		return new Response('Forbidden', { status: 403, headers });
	let r2Key: unknown;
	try {
		r2Key = ((await request.json()) as { r2_key?: unknown }).r2_key;
	} catch {
		return new Response('Invalid photo', { status: 400, headers });
	}
	if (typeof r2Key !== 'string') return new Response('Invalid photo', { status: 400, headers });
	const db = databaseFrom(env);
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		return Response.json(await makeCoverPhoto(db, params.id, r2Key), { headers });
	} catch (error) {
		if (error instanceof Error && error.message === 'Photo not found')
			return new Response(error.message, { status: 404, headers });
		return new Response('Catalog unavailable', { status: 503, headers });
	}
};
