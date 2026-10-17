import { env } from 'cloudflare:workers';
import {
	listSocialPosts,
	resetSocialPost,
	saveSocialPost
} from '../../../../../../lib/server/catalog/social-posts';
import { databaseFrom } from '../../../../../../lib/server/db/client';
import { staffActorForRequest } from '../../../../../../lib/server/staff-auth';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };

const errorStatus: Record<string, number> = {
	'Invalid caption': 400,
	'Product not found': 404
};

const failure = (error: unknown) => {
	const status = error instanceof Error ? errorStatus[error.message] : undefined;
	return status
		? new Response((error as Error).message, { status, headers })
		: new Response('Catalog unavailable', { status: 503, headers });
};

export const GET: RequestHandler = async ({ request, params }) => {
	if (!(await staffActorForRequest(request, env, import.meta.env.DEV)))
		return new Response('Forbidden', { status: 403, headers });
	const db = databaseFrom(env);
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		return Response.json(await listSocialPosts(db, params.id), { headers });
	} catch (error) {
		return failure(error);
	}
};

// Shared guard for writes: same-origin JSON from staff only.
async function writeBody(request: Request) {
	if (request.headers.get('Origin') !== new URL(request.url).origin)
		return new Response('Forbidden', { status: 403, headers });
	if (!request.headers.get('Content-Type')?.startsWith('application/json'))
		return new Response('Invalid request', { status: 415, headers });
	if (!(await staffActorForRequest(request, env, import.meta.env.DEV)))
		return new Response('Forbidden', { status: 403, headers });
	try {
		const body: unknown = await request.json();
		if (!body || typeof body !== 'object') throw new Error('Invalid request');
		return body as Record<string, unknown>;
	} catch {
		return new Response('Invalid request', { status: 400, headers });
	}
}

export const PUT: RequestHandler = async ({ request, params }) => {
	const body = await writeBody(request);
	if (body instanceof Response) return body;
	const db = databaseFrom(env);
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		return Response.json(await saveSocialPost(db, params.id, body as never), { headers });
	} catch (error) {
		return failure(error);
	}
};

export const DELETE: RequestHandler = async ({ request, params }) => {
	const body = await writeBody(request);
	if (body instanceof Response) return body;
	const db = databaseFrom(env);
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		return Response.json(await resetSocialPost(db, params.id, body.format), { headers });
	} catch (error) {
		return failure(error);
	}
};
