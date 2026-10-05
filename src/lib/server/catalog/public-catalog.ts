export type PublicProduct = {
	id: string;
	slug: string;
	name: string;
	category: 'tops' | 'bottoms' | 'outerwear' | 'dresses';
	price_bdt: number;
	stock_state: 'available' | 'reserved' | 'sold';
};

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
