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
	items: [{ name: 'TEST ONLY — Shirt', slug: 'test-shirt', price_bdt: 850 }],
	payment: {
		provider: 'mock' as const,
		payment_id: 'TESTpay',
		status: 'created' as const,
		trx_id: null,
		amount_bdt: 930,
		updated_at: '2026-10-06 10:01:00'
	},
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
	await expect
		.element(page.getByRole('button', { name: 'Update fulfillment' }))
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
	await expect
		.element(page.getByRole('combobox', { name: 'Fulfillment state' }))
		.toBeInTheDocument();
	await expect.element(page.getByRole('textbox', { name: 'Tracking code' })).toBeInTheDocument();
	await expect.element(page.getByText('Fulfillment updated.')).toBeInTheDocument();
	await expect
		.element(page.getByRole('button', { name: 'Recheck with bKash' }))
		.not.toBeInTheDocument();
	await expect.element(page.getByText('TRX1')).toBeInTheDocument();
});
