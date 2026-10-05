import { expect, it, vi } from 'vitest';
import { localDatabase } from '../testing/local-d1';
import { bkashConfigFrom, bkashProvider, d1TokenStore } from './bkash';

const env = {
	BKASH_BASE_URL: 'https://tokenized.sandbox.bka.sh',
	BKASH_USERNAME: 'sandbox-user',
	BKASH_PASSWORD: 'sandbox-pass',
	BKASH_APP_KEY: 'app-key',
	BKASH_APP_SECRET: 'app-secret'
};

function fakeBkash(overrides: Record<string, unknown> = {}) {
	return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
		const path = new URL(String(input)).pathname;
		const body = JSON.parse(String(init?.body ?? '{}'));
		if (path in overrides) return Response.json(overrides[path]);
		if (path.endsWith('/auth/grant-token'))
			return Response.json({
				statusCode: '0000',
				statusMessage: 'Successful',
				id_token: 'id-1',
				refresh_token: 'refresh-1',
				expires_in: 3600
			});
		if (path.endsWith('/payment/create'))
			return Response.json({
				paymentId: 'TR0011abc',
				bkashURL: 'https://sandbox.payment.bkash.com/?paymentId=TR0011abc&mode=0011',
				amount: body.amount,
				currency: 'BDT',
				transactionStatus: 'Initiated',
				merchantInvoiceNumber: body.merchantInvoiceNumber
			});
		if (path.endsWith('/payment/execute'))
			return Response.json({
				paymentId: body.paymentId,
				trxId: 'DIK20PG0H4',
				transactionStatus: 'Completed',
				amount: '930',
				currency: 'BDT',
				merchantInvoiceNumber: 'inv1'
			});
		if (path.endsWith('/query/payment'))
			return Response.json({
				paymentId: body.paymentId,
				transactionStatus: 'Initiated',
				amount: '930.00',
				currency: 'BDT',
				merchantInvoice: 'inv1'
			});
		return new Response('not found', { status: 404 });
	});
}

it('accepts only complete sandbox configuration', () => {
	expect(bkashConfigFrom(env)).toMatchObject({ baseUrl: 'https://tokenized.sandbox.bka.sh' });
	expect(bkashConfigFrom({ ...env, BKASH_APP_SECRET: '' })).toBeNull();
	expect(bkashConfigFrom({ ...env, BKASH_BASE_URL: 'https://tokenized.pay.bka.sh' })).toBeNull();
});

it('reuses one stored token and sends the server amount and invoice to create', async () => {
	const { db, sqlite } = localDatabase({ seed: false });
	const fetcher = fakeBkash();
	const provider = bkashProvider(bkashConfigFrom(env)!, d1TokenStore(db), fetcher);
	const created = await provider.create({
		amountBdt: 930,
		invoice: 'inv1',
		callbackUrl: 'https://dathrift.shop/checkout/callback',
		payerReference: '01712345678'
	});
	expect(created).toEqual({
		paymentId: 'TR0011abc',
		redirectUrl: 'https://sandbox.payment.bkash.com/?paymentId=TR0011abc&mode=0011'
	});
	const [, createInit] = fetcher.mock.calls[1];
	expect(new Headers(createInit?.headers).get('Authorization')).toBe('id-1');
	expect(new Headers(createInit?.headers).get('X-App-Key')).toBe('app-key');
	expect(JSON.parse(String(createInit?.body))).toEqual({
		payerReference: '01712345678',
		callbackURL: 'https://dathrift.shop/checkout/callback',
		amount: '930',
		currency: 'BDT',
		intent: 'sale',
		merchantInvoiceNumber: 'inv1'
	});
	await bkashProvider(bkashConfigFrom(env)!, d1TokenStore(db), fetcher).query('TR0011abc');
	expect(fetcher.mock.calls.filter(([url]) => String(url).includes('grant-token'))).toHaveLength(1);
	expect(sqlite.prepare('SELECT count(*) AS n FROM payment_tokens').get()).toEqual({ n: 1 });
});

it('normalizes execute and query results and rejects provider errors', async () => {
	const { db } = localDatabase({ seed: false });
	const provider = bkashProvider(bkashConfigFrom(env)!, d1TokenStore(db), fakeBkash());
	expect(await provider.execute('TR0011abc')).toEqual({
		paymentId: 'TR0011abc',
		trxId: 'DIK20PG0H4',
		status: 'completed',
		amountBdt: 930,
		currency: 'BDT',
		invoice: 'inv1'
	});
	expect(await provider.query('TR0011abc')).toMatchObject({
		status: 'initiated',
		trxId: null,
		amountBdt: 930,
		invoice: 'inv1'
	});
	const failing = bkashProvider(
		bkashConfigFrom(env)!,
		d1TokenStore(db),
		fakeBkash({
			'/v2/tokenized-checkout/payment/execute': {
				internalCode: 'payment_already_completed',
				externalCode: '2062',
				errorMessageEn: 'The payment has already been completed'
			},
			'/v2/tokenized-checkout/payment/create': {
				paymentId: 'TR0011abc',
				bkashURL: 'https://evil.example/pay'
			}
		})
	);
	await expect(failing.execute('TR0011abc')).rejects.toThrow('bKash error 2062');
	await expect(
		failing.create({
			amountBdt: 1,
			invoice: 'x',
			callbackUrl: 'https://a.b/c',
			payerReference: '1'
		})
	).rejects.toThrow();
});
