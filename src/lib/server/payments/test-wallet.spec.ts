import { expect, it } from 'vitest';
import { decideTestPayment, testPaymentFor, testWallet } from './test-wallet';

const input = {
	amountBdt: 930,
	invoice: 'inv1',
	callbackUrl: '/checkout/callback',
	payerReference: '01712345678'
};

it('completes only an approved local payment once', async () => {
	const { paymentId, redirectUrl } = await testWallet.create(input);
	expect(redirectUrl).toBe(`/checkout/test-wallet?paymentId=${paymentId}`);
	expect(testPaymentFor(paymentId)).toMatchObject({ amountBdt: 930, decision: 'pending' });
	expect(await testWallet.query(paymentId)).toMatchObject({ status: 'initiated', trxId: null });
	expect(decideTestPayment(paymentId, 'approved')).toBe(
		'/checkout/callback?paymentID=' + paymentId + '&status=success'
	);
	expect(await testWallet.execute(paymentId)).toMatchObject({
		status: 'completed',
		amountBdt: 930,
		currency: 'BDT',
		invoice: 'inv1'
	});
	await expect(testWallet.execute(paymentId)).rejects.toThrow();
	expect(await testWallet.query(paymentId)).toMatchObject({ status: 'completed' });
});

it('never completes a declined or cancelled local payment', async () => {
	const { paymentId } = await testWallet.create(input);
	expect(decideTestPayment(paymentId, 'cancelled')).toContain('status=cancel');
	await expect(testWallet.execute(paymentId)).rejects.toThrow();
	expect(await testWallet.query(paymentId)).toMatchObject({ status: 'initiated' });
	expect(decideTestPayment('missing', 'approved')).toBeNull();
});
