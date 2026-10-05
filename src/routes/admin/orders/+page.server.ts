import { env } from 'cloudflare:workers';
import { error } from '@sveltejs/kit';
import { databaseFrom } from '../../../lib/server/db/client';
import { listStaffOrders } from '../../../lib/server/orders/admin';
import { staffActorForRequest } from '../../../lib/server/staff-auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request, setHeaders }) => {
	const actor = await staffActorForRequest(request, env, import.meta.env.DEV);
	if (!actor) error(403, 'Staff access required');
	setHeaders({ 'Cache-Control': 'no-store' });
	const db = databaseFrom(env);
	if (!db) error(503, 'Orders unavailable');
	try {
		return { actor, orders: await listStaffOrders(db) };
	} catch {
		error(503, 'Orders unavailable');
	}
};
