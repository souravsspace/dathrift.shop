import { expect, it } from 'vitest';
import { load } from './+page.server';

it('denies the dashboard on public hosts but allows loopback development preview', async () => {
	await expect(
		load({ request: new Request('https://dathrift.shop/admin') } as Parameters<typeof load>[0])
	).rejects.toMatchObject({ status: 403 });
	expect(
		await load({ request: new Request('http://127.0.0.1:5173/admin') } as Parameters<
			typeof load
		>[0])
	).toMatchObject({ actor: 'local-preview' });
});
