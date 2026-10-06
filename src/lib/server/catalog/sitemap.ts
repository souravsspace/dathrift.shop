import { and, asc, eq, max, notLike } from 'drizzle-orm';
import type { Database } from '../db/client';
import { products } from '../db/schema';
import { SITE_ORIGIN } from '../../site';

type Entry = { path: string; lastmod: string | null };

const day = (timestamp: string | null) => timestamp?.slice(0, 10) ?? null;

// Test fixtures (slug prefix "test-") are noindex and never belong in the sitemap.
export async function sitemapEntries(db: Database): Promise<Entry[]> {
	const indexable = and(
		eq(products.publicationState, 'published'),
		notLike(products.slug, 'test-%')
	);
	const [pieces, categories] = await Promise.all([
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
			.orderBy(asc(products.category))
	]);
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
		...pieces.map((piece) => ({ path: `/products/${piece.slug}`, lastmod: day(piece.updatedAt) }))
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
				}</url>`
		)
		.join('');
	return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}
