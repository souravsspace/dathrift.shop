import { env } from 'cloudflare:workers';
import { createDraft } from '../../../../lib/server/catalog/admin';
import { staffActorForRequest } from '../../../../lib/server/staff-auth';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };

export const GET: RequestHandler = async ({ request }) => {
	const actor = await staffActorForRequest(request, env, import.meta.env.DEV);
	if (!actor) return new Response('Forbidden', { status: 403, headers });
	const db = (
		env as {
			DB?: { prepare(sql: string): { all(): Promise<{ results: Record<string, unknown>[] }> } };
		}
	).DB;
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		const { results } = await db
			.prepare(
				`SELECT p.id, p.slug, p.name, p.category, p.price_bdt,
				        p.publication_state, p.created_at, i.state AS stock_state
				 FROM products AS p JOIN inventory AS i ON i.product_id = p.id
				 ORDER BY p.created_at DESC, p.id DESC LIMIT 100`
			)
			.all();
		return Response.json(results, { headers });
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
	const db = (env as { DB?: Parameters<typeof createDraft>[0] }).DB;
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		return Response.json(await createDraft(db, input), { status: 201, headers });
	} catch (error) {
		if (error instanceof Error && error.message === 'Invalid draft')
			return new Response('Invalid draft', { status: 400, headers });
		return new Response('Catalog unavailable', { status: 503, headers });
	}
};
