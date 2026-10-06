import { expect, it, vi } from 'vitest';
import { handle } from './hooks.server';

type HandleInput = Parameters<typeof handle>[0];

function run(url: string) {
	const resolve = vi.fn(async () => new Response('page'));
	const response = handle({
		event: { url: new URL(url) } as HandleInput['event'],
		resolve
	} as HandleInput) as Promise<Response>;
	return { response, resolve };
}

it('sends plain-HTTP visits to the shop domains over HTTPS, keeping path and query', async () => {
	for (const host of ['dathrift.shop', 'admin.dathrift.shop']) {
		const { response, resolve } = run(`http://${host}/shop/tops?size=m`);
		const result = await response;
		expect(result.status).toBe(301);
		expect(result.headers.get('location')).toBe(`https://${host}/shop/tops?size=m`);
		expect(resolve).not.toHaveBeenCalled();
	}
});

it('sends www visits to the bare domain', async () => {
	for (const scheme of ['http', 'https']) {
		const result = await run(`${scheme}://www.dathrift.shop/products/linen-shirt?a=1`).response;
		expect(result.status).toBe(301);
		expect(result.headers.get('location')).toBe('https://dathrift.shop/products/linen-shirt?a=1');
	}
});

it('serves HTTPS pages with browser security headers', async () => {
	const result = await run('https://dathrift.shop/').response;
	expect(result.status).toBe(200);
	expect(result.headers.get('strict-transport-security')).toBe('max-age=31536000');
	expect(result.headers.get('x-content-type-options')).toBe('nosniff');
	expect(result.headers.get('x-frame-options')).toBe('DENY');
	expect(result.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
});

it('leaves local development on plain HTTP alone and without HSTS', async () => {
	const { response, resolve } = run('http://localhost:5173/admin');
	const result = await response;
	expect(resolve).toHaveBeenCalledOnce();
	expect(result.status).toBe(200);
	expect(result.headers.get('strict-transport-security')).toBeNull();
	expect(result.headers.get('x-content-type-options')).toBe('nosniff');
});
