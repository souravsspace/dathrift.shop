import { env } from 'cloudflare:workers';
import { databaseFrom } from '../../../../../../lib/server/db/client';
import { addProductPhoto } from '../../../../../../lib/server/catalog/photos';
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
		const altText = form.get('alt_text');
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
		if (error instanceof Error && error.message === 'Draft not available')
			return new Response(error.message, { status: 409, headers });
		return new Response('Photo storage unavailable', { status: 503, headers });
	}
};
