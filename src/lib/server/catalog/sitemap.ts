import { and, asc, eq, max, notLike } from 'drizzle-orm';
import type { Database } from '../db/client';
import { productPhotos, products } from '../db/schema';
import { SITE_ORIGIN } from '../../site';

type Entry = { path: string; lastmod: string | null; images?: string[] };

const day = (timestamp: string | null) => timestamp?.slice(0, 10) ?? null;

// Test fixtures (slug prefix "test-") are noindex and never belong in the sitemap.
export async function sitemapEntries(db: Database): Promise<Entry[]> {
	const indexable = and(
		eq(products.publicationState, 'published'),
		notLike(products.slug, 'test-%')
	);
	const [pieces, categories, photos] = await Promise.all([
		db
			.select({ slug: products.slug, updatedAt: products.updatedAt })
			.from(products)
			.where(indexable)
			.orderBy(asc(products.slug)),
		db
			.select({ category: products.category, updatedAt: max(products.updatedAt) })
			.from(products)
			.where(indexable)
			.groupBy(products.category)
			.orderBy(asc(products.category)),
		db
			.select({ slug: products.slug, key: productPhotos.r2Key })
			.from(productPhotos)
			.innerJoin(products, eq(products.id, productPhotos.productId))
			.where(indexable)
			.orderBy(asc(productPhotos.position))
	]);
	// Product photos go in the sitemap too, so image search can find each piece.
	const images = new Map<string, string[]>();
	for (const photo of photos)
		images.set(photo.slug, [...(images.get(photo.slug) ?? []), photo.key]);
	const latest = pieces.reduce<string | null>(
		(newest, piece) =>
			piece.updatedAt && (!newest || piece.updatedAt > newest) ? piece.updatedAt : newest,
		null
	);
	return [
		{ path: '/', lastmod: day(latest) },
		// The all-pieces shop page exists once there is indexable stock to list.
		...(pieces.length ? [{ path: '/shop', lastmod: day(latest) }] : []),
		...categories.map((row) => ({ path: `/shop/${row.category}`, lastmod: day(row.updatedAt) })),
		...pieces.map((piece) => ({
			path: `/products/${piece.slug}`,
			lastmod: day(piece.updatedAt),
			images: images.get(piece.slug) ?? []
		}))
	];
}

const escape = (value: string) =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function sitemapXml(entries: Entry[]) {
	const urls = entries
		.map(
			(entry) =>
				`<url><loc>${escape(`${SITE_ORIGIN}${entry.path}`)}</loc>${
					entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''
				}${(entry.images ?? [])
					.map(
						(key) =>
							`<image:image><image:loc>${escape(`${SITE_ORIGIN}/media/${key}`)}</image:loc></image:image>`
					)
					.join('')}</url>`
		)
		.join('');
	return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls}</urlset>`;
}
