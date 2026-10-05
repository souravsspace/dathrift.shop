import { env } from 'cloudflare:workers';
import { isPublishedPhoto } from '../../../lib/server/catalog/public-catalog';
import { databaseFrom } from '../../../lib/server/db/client';
import type { RequestHandler } from './$types';

type MediaEnv = {
	PRODUCT_IMAGES?: {
		get(key: string): Promise<{
			body: ReadableStream;
			httpMetadata?: { contentType?: string };
		} | null>;
	};
};

const noStore = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const imageTypes = new Set(['image/webp', 'image/jpeg', 'image/png', 'image/avif']);

export const GET: RequestHandler = async ({ params }) => {
	const key = params.key;
	if (!/^(?=.{1,256}$)(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.(?:webp|jpe?g|png|avif)$/.test(key))
		return new Response('Not found', { status: 404, headers: noStore });
	const db = databaseFrom(env);
	const { PRODUCT_IMAGES } = env as MediaEnv;
	if (!db || !PRODUCT_IMAGES)
		return new Response('Media unavailable', { status: 503, headers: noStore });
	try {
		const published = await isPublishedPhoto(db, key);
		if (!published) return new Response('Not found', { status: 404, headers: noStore });
		const object = await PRODUCT_IMAGES.get(key);
		if (!object) return new Response('Not found', { status: 404, headers: noStore });
		const contentType = object.httpMetadata?.contentType;
		if (!contentType || !imageTypes.has(contentType))
			return new Response('Media unavailable', { status: 503, headers: noStore });
		return new Response(object.body, {
			headers: { ...noStore, 'Content-Type': contentType }
		});
	} catch {
		return new Response('Media unavailable', { status: 503, headers: noStore });
	}
};
