import { env } from 'cloudflare:workers';
import { sitemapEntries, sitemapXml } from '../../lib/server/catalog/sitemap';
import { databaseFrom } from '../../lib/server/db/client';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const db = databaseFrom(env);
	if (!db) return new Response('Sitemap unavailable', { status: 503 });
	try {
		return new Response(sitemapXml(await sitemapEntries(db)), {
			headers: {
				'Content-Type': 'application/xml; charset=utf-8',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch {
		return new Response('Sitemap unavailable', { status: 503 });
	}
};
