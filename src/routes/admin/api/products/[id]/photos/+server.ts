import { env } from 'cloudflare:workers';
import { databaseFrom } from '../../../../../../lib/server/db/client';
import { addProductPhoto, deleteProductPhoto } from '../../../../../../lib/server/catalog/photos';
import { staffActorForRequest } from '../../../../../../lib/server/staff-auth';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'no-store' };

export const POST: RequestHandler = async ({ request, params }) => {
	if (request.headers.get('Origin') !== new URL(request.url).origin)
		return new Response('Forbidden', { status: 403, headers });
	if (!request.headers.get('Content-Type')?.startsWith('multipart/form-data'))
		return new Response('Invalid request', { status: 415, headers });
	if (!(await staffActorForRequest(request, env, import.meta.env.DEV)))
		return new Response('Forbidden', { status: 403, headers });
	const db = databaseFrom(env);
	const bucket = (env as { PRODUCT_IMAGES?: Parameters<typeof addProductPhoto>[1] }).PRODUCT_IMAGES;
	if (!db || !bucket) return new Response('Photo storage unavailable', { status: 503, headers });
	try {
		const form = await request.formData();
		const photo = form.get('photo');
		// Staff no longer describe photos; the storefront names them after the piece.
		const altText = form.get('alt_text') ?? '';
		const position = form.get('position');
		if (!(photo instanceof File) || typeof altText !== 'string' || typeof position !== 'string')
			return new Response('Invalid photo', { status: 400, headers });
		const result = await addProductPhoto(db, bucket, params.id, {
			bytes: new Uint8Array(await photo.arrayBuffer()),
			contentType: photo.type,
			position: Number(position),
			altText
		});
		return Response.json(result, { status: 201, headers });
	} catch (error) {
		if (error instanceof Error && error.message === 'Invalid photo')
			return new Response(error.message, { status: 400, headers });
		if (error instanceof Error && error.message === 'Product not available')
			return new Response(error.message, { status: 409, headers });
		return new Response('Photo storage unavailable', { status: 503, headers });
	}
};

const removalStatus: Record<string, number> = {
	'Product not found': 404,
	'Photo not found': 404,
	'Product held': 409,
	'Last photo': 409
};

export const DELETE: RequestHandler = async ({ request, params }) => {
	if (request.headers.get('Origin') !== new URL(request.url).origin)
		return new Response('Forbidden', { status: 403, headers });
	if (!request.headers.get('Content-Type')?.startsWith('application/json'))
		return new Response('Invalid request', { status: 415, headers });
	if (!(await staffActorForRequest(request, env, import.meta.env.DEV)))
		return new Response('Forbidden', { status: 403, headers });
	const db = databaseFrom(env);
	const bucket = (env as { PRODUCT_IMAGES?: Parameters<typeof deleteProductPhoto>[1] })
		.PRODUCT_IMAGES;
	if (!db || !bucket) return new Response('Photo storage unavailable', { status: 503, headers });
	let r2Key: unknown;
	try {
		r2Key = ((await request.json()) as { r2_key?: unknown }).r2_key;
	} catch {
		return new Response('Invalid request', { status: 400, headers });
	}
	if (typeof r2Key !== 'string' || !r2Key)
		return new Response('Invalid request', { status: 400, headers });
	try {
		return Response.json(await deleteProductPhoto(db, bucket, params.id, r2Key), { headers });
	} catch (error) {
		const status = error instanceof Error ? removalStatus[error.message] : undefined;
		return status
			? new Response((error as Error).message, { status, headers })
			: new Response('Photo storage unavailable', { status: 503, headers });
	}
};
