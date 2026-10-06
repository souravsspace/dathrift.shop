import type { Handle } from '@sveltejs/kit/hooks';

const shopHosts = new Set(['dathrift.shop', 'admin.dathrift.shop']);

function moved(url: URL, host: string) {
	return new Response(null, {
		status: 301,
		headers: { location: `https://${host}${url.pathname}${url.search}` }
	});
}

export const handle: Handle = async ({ event, resolve }) => {
	const { url } = event;
	if (url.hostname === 'www.dathrift.shop') return moved(url, 'dathrift.shop');
	if (url.protocol === 'http:' && shopHosts.has(url.hostname)) return moved(url, url.hostname);

	const response = await resolve(event);
	if (url.protocol === 'https:')
		response.headers.set('Strict-Transport-Security', 'max-age=31536000');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	return response;
};
