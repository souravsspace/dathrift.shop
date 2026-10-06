import { page } from 'vitest/browser';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import OrderPage from './+page.svelte';

const order = {
	id: 'order-1',
	reference: 'ORDER1AB',
	status: 'payment_review' as const,
	subtotal_bdt: 850,
	shipping_bdt: 80,
	total_bdt: 930,
	preview_only: true,
	created_at: '2026-10-06 10:00:00',
	expires_at: '2026-10-06 10:15:00',
	area: 'TEST ONLY — Central area',
	address: {
		name: 'Test Buyer',
		phone: '01712345678',
		line1: 'House 1',
		district: 'test-dhaka',
		area: 'test-central'
	},
	items: [{ name: 'TEST ONLY — Shirt', code: 'OC2026001', slug: 'test-shirt', price_bdt: 850 }],
	payment: {
		provider: 'mock' as const,
		payment_id: 'TESTpay',
		status: 'created' as const,
		trx_id: null,
		amount_bdt: 930,
		updated_at: '2026-10-06 10:01:00'
	},
	manual: null,
	fulfillment: null,
	events: [
		{ actor: 'system', action: 'payment_review', note: null, created_at: '2026-10-06 10:02:00' }
	]
};

it('gives the owner provider recheck and confirmed close, but no paid toggle', async () => {
	render(OrderPage, { data: { order, is_owner: true }, form: null });
	await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('ORDER1AB');
	await expect.element(page.getByText('01712345678')).toBeInTheDocument();
	await expect
		.element(page.getByRole('button', { name: 'Recheck with bKash' }))
		.toBeInTheDocument();
	await expect
		.element(page.getByRole('checkbox', { name: /I checked bKash records/ }))
		.toBeInTheDocument();
	await expect.element(page.getByRole('button', { name: /mark.*paid/i })).not.toBeInTheDocument();
	await expect.element(page.getByText('Check payment', { exact: true })).toBeInTheDocument();
	await expect.element(page.getByText('Placed 6 Oct 2026, 4:00 pm')).toBeInTheDocument();
	await expect
		.element(page.getByRole('button', { name: 'Start preparing' }))
		.not.toBeInTheDocument();
});

it('lets staff record fulfillment on a paid order without owner payment controls', async () => {
	render(OrderPage, {
		data: {
			order: {
				...order,
				status: 'paid' as const,
				payment: { ...order.payment, status: 'completed' as const, trx_id: 'TRX1' }
			},
			is_owner: false
		},
		form: { message: 'Fulfillment updated.' }
	});
	await expect.element(page.getByRole('button', { name: 'Start preparing' })).toBeInTheDocument();
	await expect.element(page.getByText('Fulfillment updated.')).toBeInTheDocument();
	await page.getByRole('button', { name: 'Dismiss message' }).click();
	await expect.element(page.getByText('Fulfillment updated.')).not.toBeInTheDocument();
	await expect
		.element(page.getByRole('link', { name: '01712345678' }))
		.toHaveAttribute('href', 'tel:01712345678');
	await expect
		.element(page.getByRole('button', { name: 'Recheck with bKash' }))
		.not.toBeInTheDocument();
	await expect.element(page.getByText('TRX1')).toBeInTheDocument();
});

it('asks for a courier and tracking code to dispatch, then offers delivery', async () => {
	const paid = {
		...order,
		status: 'paid' as const,
		payment: { ...order.payment, status: 'completed' as const, trx_id: 'TRX1' }
	};
	const fulfilled = (
		state: 'preparing' | 'dispatched',
		courier: string | null,
		code: string | null
	) => ({
		order: {
			...paid,
			fulfillment: { state, courier, tracking_code: code, updated_at: '2026-10-06 11:00:00' }
		},
		is_owner: false
	});
	const { rerender } = render(OrderPage, { data: fulfilled('preparing', null, null), form: null });
	await expect.element(page.getByRole('radio', { name: 'Pathao' })).toBeInTheDocument();
	await expect.element(page.getByRole('radio', { name: 'Steadfast' })).toBeInTheDocument();
	await expect.element(page.getByRole('textbox', { name: 'Tracking code' })).toBeInTheDocument();
	await expect.element(page.getByRole('button', { name: 'Mark dispatched' })).toBeInTheDocument();
	await rerender({ data: fulfilled('dispatched', 'Pathao', 'TEST-TRACK-9'), form: null });
	await expect.element(page.getByRole('button', { name: 'Mark delivered' })).toBeInTheDocument();
	await expect.element(page.getByText('Pathao · TEST-TRACK-9').first()).toBeInTheDocument();
});

const manualOrder = {
	...order,
	payment: null,
	shipping_bdt: 135,
	total_bdt: 985,
	manual: {
		pay_to: '01849584594',
		plan: 'delivery' as const,
		amount_bdt: 135,
		trx_id: '8N7A6D5C4B',
		sender_number: '01812345678',
		submitted_at: '2026-10-07 10:00:00',
		reviewed_by: null,
		reviewed_at: null
	}
};

it('lets the moderator confirm or reject a manual bKash payment after checking the app', async () => {
	render(OrderPage, { data: { order: manualOrder, is_owner: false }, form: null });
	await expect
		.element(page.getByRole('heading', { name: 'Check the bKash payment' }))
		.toBeInTheDocument();
	await expect.element(page.getByText('8N7A6D5C4B').first()).toBeInTheDocument();
	await expect
		.element(page.getByRole('checkbox', { name: /I found this payment in the bKash app/ }))
		.toHaveAttribute('value', 'found-in-bkash');
	await expect
		.element(page.getByRole('button', { name: 'Payment found · mark paid' }))
		.toBeInTheDocument();
	await expect
		.element(page.getByRole('button', { name: /Not found · close order/ }))
		.toBeInTheDocument();
	await expect
		.element(page.getByRole('button', { name: 'Recheck with bKash' }))
		.not.toBeInTheDocument();
});

it('tells staff how much cash the courier must collect when only delivery was paid', async () => {
	render(OrderPage, {
		data: {
			order: {
				...manualOrder,
				status: 'paid' as const,
				manual: {
					...manualOrder.manual,
					reviewed_by: 'mod@example.com',
					reviewed_at: '2026-10-07 10:05:00'
				}
			},
			is_owner: false
		},
		form: null
	});
	await expect.element(page.getByText(/courier must collect/)).toHaveTextContent('৳850');
	await expect
		.element(page.getByRole('heading', { name: 'Check the bKash payment' }))
		.not.toBeInTheDocument();
});
