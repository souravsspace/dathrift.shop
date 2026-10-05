import { env } from 'cloudflare:workers';
import type { RequestHandler } from './$types';

type MediaEnv = {
	DB?: {
		prepare(sql: string): {
			bind(key: string): { first(): Promise<Record<string, unknown> | null> };
		};
	};
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
	const { DB, PRODUCT_IMAGES } = env as MediaEnv;
	if (!DB || !PRODUCT_IMAGES)
		return new Response('Media unavailable', { status: 503, headers: noStore });
	try {
		const published = await DB.prepare(
			`SELECT photo.product_id FROM product_photos AS photo
			 JOIN products AS p ON p.id = photo.product_id
			 WHERE photo.r2_key = ? AND p.publication_state = 'published'`
		)
			.bind(key)
			.first();
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
