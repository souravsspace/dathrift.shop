import { expect, it, vi } from 'vitest';
import { staffActorForRequest, staffEmailForRequest } from './staff-auth';

const env = {
	STAFF_HOST: 'admin.dathrift.shop',
	STAFF_EMAILS: 'owner@example.com,moderator@example.com',
	ACCESS_TEAM_DOMAIN: 'https://shop.cloudflareaccess.com',
	ACCESS_AUD: 'audience-1'
};

it('denies alternate hosts and unsigned requests before consulting identity', async () => {
	const verify = vi.fn(async () => 'owner@example.com');
	const request = (url: string, token?: string) =>
		new Request(url, { headers: token ? { 'Cf-Access-Jwt-Assertion': token } : {} });

	expect(
		await staffEmailForRequest(request('https://alternate.workers.dev/admin', 'jwt'), env, verify)
	).toBeNull();
	expect(
		await staffEmailForRequest(request('https://admin.dathrift.shop/admin'), env, verify)
	).toBeNull();
	expect(verify).not.toHaveBeenCalled();
});

it('permits a loopback-only local staff preview but never treats it as production identity', async () => {
	const request = (url: string) => new Request(url);
	expect(await staffActorForRequest(request('http://127.0.0.1:5173/admin'), {}, true)).toBe(
		'local-preview'
	);
	expect(await staffActorForRequest(request('http://127.0.0.1:5173/admin'), {}, false)).toBeNull();
	expect(await staffActorForRequest(request('http://dev.example.com/admin'), {}, true)).toBeNull();
});

it('accepts only a verified allowlisted staff email', async () => {
	const request = new Request('https://admin.dathrift.shop/admin', {
		headers: { 'Cf-Access-Jwt-Assertion': 'signed-token' }
	});
	const verify = vi.fn(async () => 'OWNER@example.com');

	expect(await staffEmailForRequest(request, env, verify)).toBe('owner@example.com');
	expect(verify).toHaveBeenCalledExactlyOnceWith(
		'signed-token',
		'https://shop.cloudflareaccess.com',
		'audience-1'
	);
	expect(await staffEmailForRequest(request, env, async () => 'stranger@example.com')).toBeNull();
});
