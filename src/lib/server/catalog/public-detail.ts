export type PublicProductDetail = {
	id: string;
	slug: string;
	name: string;
	category: string;
	brand: string | null;
	price_bdt: number;
	stock_state: 'available' | 'reserved' | 'sold';
	description: string | null;
	condition_notes: string | null;
	size_label: string | null;
	fit_note: string | null;
	measurements: Record<string, number>;
	photos: { key: string; alt: string }[];
};

type DetailDb = {
	prepare(sql: string): {
		bind(slug: string): { first(): Promise<Record<string, unknown> | null> };
	};
};

export async function getPublicProductDetail(
	db: DetailDb,
	slug: string
): Promise<PublicProductDetail | null> {
	const row = await db
		.prepare(
			`SELECT p.id, p.slug, p.name, p.category, p.brand, p.price_bdt,
			        p.description, p.condition_notes, p.size_label, p.fit_note,
			        p.measurements_json, i.state AS stock_state,
			        COALESCE((
			          SELECT json_group_array(json_object('key', r2_key, 'alt', alt_text))
			          FROM (
			            SELECT r2_key, alt_text FROM product_photos
			            WHERE product_id = p.id ORDER BY position
			          )
			        ), '[]') AS photos_json
			 FROM products AS p
			 JOIN inventory AS i ON i.product_id = p.id
			 WHERE p.slug = ? AND p.publication_state = 'published'`
		)
		.bind(slug)
		.first();
	if (!row) return null;
	const { measurements_json, photos_json, ...details } = row;
	return {
		...details,
		measurements: JSON.parse((measurements_json as string | null) ?? '{}'),
		photos: JSON.parse(photos_json as string)
	} as PublicProductDetail;
}
