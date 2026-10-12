import { env } from 'cloudflare:workers';
import type { Handle } from '@sveltejs/kit/hooks';
import { databaseFrom } from './lib/server/db/client';
import { expireManualHolds } from './lib/server/payments/manual';

const shopHosts = new Set(['dathrift.shop', 'admin.dathrift.shop']);

function moved(url: URL, host: string) {
	return new Response(null, {
		status: 301,
		headers: { location: `https://${host}${url.pathname}${url.search}` }
	});
}

// An abandoned bKash hold lapses after 30 minutes, but only a new checkout or that order's own page
// released it, so the shop kept showing the piece sold out. Each isolate sweeps at most once a
// minute, before the page reads stock.
const SWEEP_EVERY_MS = 60_000;
let lastSweep = -Infinity;

async function releaseLapsedHolds() {
	const db = databaseFrom(env);
	if (!db || Date.now() - lastSweep < SWEEP_EVERY_MS) return;
	lastSweep = Date.now();
	try {
		await expireManualHolds(db);
	} catch {
		// Best effort: checkout and the order page still expire holds themselves.
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const { url } = event;
	if (url.hostname === 'www.dathrift.shop') return moved(url, 'dathrift.shop');
	if (url.protocol === 'http:' && shopHosts.has(url.hostname)) return moved(url, url.hostname);

	await releaseLapsedHolds();
	const response = await resolve(event);
	if (url.protocol === 'https:')
		response.headers.set('Strict-Transport-Security', 'max-age=31536000');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	return response;
};
