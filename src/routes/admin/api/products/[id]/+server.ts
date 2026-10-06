import { env } from 'cloudflare:workers';
import { databaseFrom } from '../../../../../lib/server/db/client';
import {
	getStaffProduct,
	removeProduct,
	updateProductDetails
} from '../../../../../lib/server/catalog/admin';
import { staffActorForRequest } from '../../../../../lib/server/staff-auth';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };

export const GET: RequestHandler = async ({ request, params }) => {
	if (!(await staffActorForRequest(request, env, import.meta.env.DEV)))
		return new Response('Forbidden', { status: 403, headers });
	const db = databaseFrom(env);
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		const product = await getStaffProduct(db, params.id);
		if (!product) return new Response('Not found', { status: 404, headers });
		return Response.json(product, { headers });
	} catch {
		return new Response('Catalog unavailable', { status: 503, headers });
	}
};

export const PATCH: RequestHandler = async ({ request, params }) => {
	if (request.headers.get('Origin') !== new URL(request.url).origin)
		return new Response('Forbidden', { status: 403, headers });
	if (!request.headers.get('Content-Type')?.startsWith('application/json'))
		return new Response('Invalid request', { status: 415, headers });
	if (!(await staffActorForRequest(request, env, import.meta.env.DEV)))
		return new Response('Forbidden', { status: 403, headers });
	const db = databaseFrom(env);
	if (!db) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		return Response.json(await updateProductDetails(db, params.id, await request.json()), {
			headers
		});
	} catch (error) {
		return catalogError(error);
	}
};

export const DELETE: RequestHandler = async ({ request, params }) => {
	if (request.headers.get('Origin') !== new URL(request.url).origin)
		return new Response('Forbidden', { status: 403, headers });
	if (!(await staffActorForRequest(request, env, import.meta.env.DEV)))
		return new Response('Forbidden', { status: 403, headers });
	const db = databaseFrom(env);
	const bucket = (env as { PRODUCT_IMAGES?: Parameters<typeof removeProduct>[1] }).PRODUCT_IMAGES;
	if (!db || !bucket) return new Response('Catalog unavailable', { status: 503, headers });
	try {
		return Response.json(await removeProduct(db, bucket, params.id), { headers });
	} catch (error) {
		return catalogError(error);
	}
};

const errorStatus: Record<string, number> = {
	'Invalid details': 400,
	'Unknown category': 400,
	'Product not found': 404,
	'Product held': 409,
	'Product changed; retry': 409,
	'Incomplete product': 422
};

function catalogError(error: unknown) {
	const status = error instanceof Error ? errorStatus[error.message] : undefined;
	return status
		? new Response((error as Error).message, { status, headers })
		: new Response('Catalog unavailable', { status: 503, headers });
}
