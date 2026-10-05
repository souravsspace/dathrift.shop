import type { PaymentProvider, ProviderPayment } from './provider';

// Local development stand-in for the bKash payment page. State lives in this Worker process
// only; it is never selected outside a development build.
type TestPayment = {
	amountBdt: number;
	invoice: string;
	callbackUrl: string;
	decision: 'pending' | 'approved' | 'declined' | 'cancelled';
	tried: boolean;
	trxId: string | null;
};

const payments = new Map<string, TestPayment>();

function result(paymentId: string, payment: TestPayment): ProviderPayment {
	return {
		paymentId,
		trxId: payment.trxId,
		status: payment.trxId ? 'completed' : 'initiated',
		amountBdt: payment.amountBdt,
		currency: 'BDT',
		invoice: payment.invoice
	};
}

function find(paymentId: string) {
	const payment = payments.get(paymentId);
	if (!payment) throw new Error('Invalid Payment ID');
	return payment;
}

export function testPaymentFor(paymentId: string) {
	const payment = payments.get(paymentId);
	return payment ? { amountBdt: payment.amountBdt, decision: payment.decision } : null;
}

export function decideTestPayment(
	paymentId: string,
	decision: 'approved' | 'declined' | 'cancelled'
): string | null {
	const payment = payments.get(paymentId);
	if (!payment || payment.decision !== 'pending') return null;
	payment.decision = decision;
	const status = { approved: 'success', declined: 'failure', cancelled: 'cancel' }[decision];
	const separator = payment.callbackUrl.includes('?') ? '&' : '?';
	return `${payment.callbackUrl}${separator}paymentID=${encodeURIComponent(paymentId)}&status=${status}`;
}

export const testWallet: PaymentProvider = {
	name: 'mock',
	async create(input) {
		const paymentId = `TEST${crypto.randomUUID().replace(/-/g, '')}`;
		payments.set(paymentId, {
			amountBdt: input.amountBdt,
			invoice: input.invoice,
			callbackUrl: input.callbackUrl,
			decision: 'pending',
			tried: false,
			trxId: null
		});
		return { paymentId, redirectUrl: `/checkout/test-wallet?paymentId=${paymentId}` };
	},
	async execute(paymentId) {
		const payment = find(paymentId);
		if (payment.tried) throw new Error('Payment already executed');
		payment.tried = true;
		if (payment.decision !== 'approved') throw new Error('Payment execution pre-requisite not met');
		payment.trxId = `TESTTRX${Date.now().toString(36).toUpperCase()}`;
		return result(paymentId, payment);
	},
	query: async (paymentId) => result(paymentId, find(paymentId))
};
