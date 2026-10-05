import { error, redirect } from '@sveltejs/kit';
import { decideTestPayment, testPaymentFor } from '../../../lib/server/payments/test-wallet';
import type { Actions, PageServerLoad } from './$types';

// Development-only stand-in for the bKash payment page.
function pending(url: URL) {
	if (!import.meta.env.DEV) error(404, 'Not found');
	const paymentId = url.searchParams.get('paymentId') ?? '';
	const payment = testPaymentFor(paymentId);
	if (!payment || payment.decision !== 'pending') error(404, 'Payment not found');
	return { paymentId, amount_bdt: payment.amountBdt };
}

export const load: PageServerLoad = async ({ url }) => pending(url);

export const actions: Actions = {
	default: async ({ url, request }) => {
		const { paymentId } = pending(url);
		const decision = (await request.formData()).get('decision');
		if (decision !== 'approved' && decision !== 'declined' && decision !== 'cancelled')
			error(400, 'Invalid decision');
		const target = decideTestPayment(paymentId, decision);
		if (!target) error(404, 'Payment not found');
		const next = new URL(target, url);
		if (next.origin !== url.origin) error(400, 'Invalid callback');
		redirect(303, `${next.pathname}${next.search}`);
	}
};
