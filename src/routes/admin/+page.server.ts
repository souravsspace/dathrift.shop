import { env } from 'cloudflare:workers';
import { error } from '@sveltejs/kit';
import { staffActorForRequest } from '../../lib/server/staff-auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request, setHeaders }) => {
	const actor = await staffActorForRequest(request, env, import.meta.env.DEV);
	if (!actor) error(403, 'Staff access required');
	setHeaders?.({ 'Cache-Control': 'no-store' });
	return { actor };
};
