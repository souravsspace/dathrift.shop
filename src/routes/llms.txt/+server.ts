import { env } from 'cloudflare:workers';
import { llmsTxt } from '../../lib/server/catalog/llms';
import { databaseFrom } from '../../lib/server/db/client';
import { manualBkashFrom } from '../../lib/server/payments/manual';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const db = databaseFrom(env);
	if (!db) return new Response('Unavailable', { status: 503 });
	try {
		const text = await llmsTxt(db, { manualBkash: manualBkashFrom(env) !== null });
		return new Response(text, {
			headers: {
				'Content-Type': 'text/markdown; charset=utf-8',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch {
		return new Response('Unavailable', { status: 503 });
	}
};
