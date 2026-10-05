import { expect, it } from 'vitest';
import { load } from './+page.server';

it('guards the garment editor HTML and permits only loopback local preview', async () => {
	await expect(
		load({
			request: new Request('https://dathrift.shop/admin/products/test-id'),
			params: { id: 'test-id' },
			setHeaders: () => undefined
		} as unknown as Parameters<typeof load>[0])
	).rejects.toMatchObject({ status: 403 });
	const headers: Record<string, string> = {};
	expect(
		await load({
			request: new Request('http://127.0.0.1:5173/admin/products/test-id'),
			params: { id: 'test-id' },
			setHeaders: (value: Record<string, string>) => Object.assign(headers, value)
		} as unknown as Parameters<typeof load>[0])
	).toEqual({ actor: 'local-preview', id: 'test-id' });
	expect(headers['Cache-Control']).toBe('no-store');
});
