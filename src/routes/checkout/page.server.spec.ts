import { env } from 'cloudflare:workers';
import { afterEach, expect, it, vi } from 'vitest';
import { localD1 } from '../../lib/server/testing/local-d1';
import { load } from './+page.server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
	vi.unstubAllEnvs();
});

const event = () => ({ setHeaders: vi.fn() }) as unknown as Parameters<typeof load>[0];

it('offers server-maintained areas and enables payment only with a configured provider', async () => {
	await expect(load(event())).rejects.toMatchObject({ status: 503 });
	(env as { DB?: unknown }).DB = localD1().db;
	const data = (await load(event())) as {
		checkout_enabled: boolean;
		manual_payment: boolean;
		areas: { district: string; name: string; fee_bdt: number }[];
	};
	expect(data).toMatchObject({ checkout_enabled: true, manual_payment: false });
	expect(data.areas).toContainEqual(
		expect.objectContaining({ district: 'test-dhaka', name: 'TEST ONLY — Central area' })
	);
	vi.stubEnv('DEV', false);
	const live = (await load(event())) as typeof data;
	expect(live.checkout_enabled).toBe(false);
	expect(live.areas.some((area) => area.district.startsWith('test-'))).toBe(false);
});

it('lists the Steadfast zones: Dhaka City 75, near Dhaka 105, the rest 135', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	vi.stubEnv('DEV', false);
	const { areas } = (await load(event())) as { areas: { district: string; fee_bdt: number }[] };
	const fee = (district: string) => areas.find((area) => area.district === district)?.fee_bdt;
	expect(areas).toHaveLength(65);
	expect([fee('dhaka-city'), fee('dhaka-suburbs'), fee('gazipur'), fee('narayanganj')]).toEqual([
		75, 105, 105, 105
	]);
	expect([fee('chattogram'), fee('munshiganj'), fee('coxs-bazar'), fee('sylhet')]).toEqual([
		135, 135, 135, 135
	]);
});

it('switches to manual bKash when it is turned on, even without a payment provider', async () => {
	Object.assign(env, {
		DB: localD1().db,
		BKASH_MANUAL_PAYMENT: 'on',
		BKASH_MANUAL_NUMBER: '01849584594'
	});
	vi.stubEnv('DEV', false);
	expect(await load(event())).toMatchObject({ checkout_enabled: true, manual_payment: true });
	delete (env as Record<string, unknown>).BKASH_MANUAL_PAYMENT;
	delete (env as Record<string, unknown>).BKASH_MANUAL_NUMBER;
});
