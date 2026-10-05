import { afterEach, expect, it, vi } from 'vitest';
import { testWallet } from '../../../lib/server/payments/test-wallet';
import { actions, load } from './+page.server';

afterEach(() => {
	vi.unstubAllEnvs();
});

const url = (paymentId: string) =>
	new URL(`http://127.0.0.1:5173/checkout/test-wallet?paymentId=${paymentId}`);

it('offers a local-only wallet decision that returns through the payment callback', async () => {
	const { paymentId } = await testWallet.create({
		amountBdt: 930,
		invoice: 'inv1',
		callbackUrl: 'http://127.0.0.1:5173/checkout/callback',
		payerReference: '01712345678'
	});
	expect(await load({ url: url(paymentId) } as Parameters<typeof load>[0])).toEqual({
		paymentId,
		amount_bdt: 930
	});
	const form = new FormData();
	form.set('decision', 'approved');
	await expect(
		actions.default({
			url: url(paymentId),
			request: new Request(url(paymentId), { method: 'POST', body: form })
		} as Parameters<typeof actions.default>[0])
	).rejects.toMatchObject({
		status: 303,
		location: `/checkout/callback?paymentID=${paymentId}&status=success`
	});
	await expect(
		load({ url: url('TESTmissing') } as Parameters<typeof load>[0])
	).rejects.toMatchObject({ status: 404 });
});

it('does not exist outside a development build', async () => {
	vi.stubEnv('DEV', false);
	await expect(load({ url: url('TESTany') } as Parameters<typeof load>[0])).rejects.toMatchObject({
		status: 404
	});
});
