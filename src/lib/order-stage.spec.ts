import { expect, it } from 'vitest';
import { actorLabel, eventLabel, orderStage } from './order-stage';

it('names one stage per order from its payment status and fulfillment', () => {
	expect(orderStage('payment_review', null)).toBe('review');
	expect(orderStage('pending_payment', null)).toBe('awaiting');
	expect(orderStage('paid', null)).toBe('to_ship');
	expect(orderStage('paid', 'preparing')).toBe('to_ship');
	expect(orderStage('paid', 'dispatched')).toBe('dispatched');
	expect(orderStage('paid', 'delivered')).toBe('delivered');
	expect(orderStage('cancelled', null)).toBe('closed');
	expect(orderStage('expired', null)).toBe('expired');
});

it('writes history in plain words', () => {
	expect(eventLabel('fulfillment_dispatched')).toBe('Dispatched to the courier');
	expect(eventLabel('something_new')).toBe('Something new');
	expect(actorLabel('system')).toBe('System');
	expect(actorLabel('local-preview')).toBe('Local preview');
	expect(actorLabel('owner@example.com')).toBe('owner@example.com');
});
