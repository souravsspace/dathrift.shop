export type PublicProduct = {
	id: string;
	slug: string;
	name: string;
	category: 'tops' | 'bottoms' | 'outerwear' | 'dresses';
	price_bdt: number;
	stock_state: 'available' | 'reserved' | 'sold';
};

export type PublicListing = PublicProduct & {
	size_label: string | null;
	condition_notes: string | null;
	photo_key: string | null;
	photo_alt: string | null;
};

type PublicListDb = {
	prepare(sql: string): { all(): Promise<{ results: Record<string, unknown>[] }> };
};

export async function listPublicProducts(db: PublicListDb): Promise<PublicListing[]> {
	const { results } = await db
		.prepare(
			`SELECT p.id, p.slug, p.name, p.category, p.price_bdt,
			        p.size_label, p.condition_notes, i.state AS stock_state,
			        photo.r2_key AS photo_key, photo.alt_text AS photo_alt
			 FROM products AS p
			 JOIN inventory AS i ON i.product_id = p.id
			 LEFT JOIN product_photos AS photo ON photo.product_id = p.id AND photo.position = 1
			 WHERE p.publication_state = 'published'
			 ORDER BY p.created_at DESC, p.id DESC
			 LIMIT 24`
		)
		.all();
	return results as PublicListing[];
}

type PublicProductDb = {
	prepare(sql: string): {
		bind(slug: string): { first(): Promise<Record<string, unknown> | null> };
	};
};

export async function getPublicProduct(
	db: PublicProductDb,
	slug: string
): Promise<PublicProduct | null> {
	const row = await db
		.prepare(
			`SELECT p.id, p.slug, p.name, p.category, p.price_bdt, i.state AS stock_state
			 FROM products AS p
			 JOIN inventory AS i ON i.product_id = p.id
			 WHERE p.slug = ? AND p.publication_state = 'published'`
		)
		.bind(slug)
		.first();
	return row as PublicProduct | null;
}
