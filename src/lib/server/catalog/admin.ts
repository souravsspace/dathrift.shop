import { publicationErrors } from './publication';

type DraftInput = {
	slug: string;
	name: string;
	category: 'tops' | 'bottoms' | 'outerwear' | 'dresses';
	price_bdt: number;
};

type Statement = { run(): unknown };
type AdminDb = {
	prepare(sql: string): { bind(...values: (string | number)[]): Statement };
	batch(statements: Statement[]): Promise<unknown>;
};

function isDraftInput(value: unknown): value is DraftInput {
	if (!value || typeof value !== 'object') return false;
	const input = value as Record<string, unknown>;
	return (
		typeof input.slug === 'string' &&
		input.slug.length <= 160 &&
		/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) &&
		typeof input.name === 'string' &&
		input.name.trim().length > 0 &&
		input.name.length <= 160 &&
		typeof input.category === 'string' &&
		['tops', 'bottoms', 'outerwear', 'dresses'].includes(input.category) &&
		Number.isSafeInteger(input.price_bdt) &&
		(input.price_bdt as number) > 0
	);
}

export async function createDraft(db: AdminDb, input: unknown) {
	if (!isDraftInput(input)) throw new Error('Invalid draft');
	const id = crypto.randomUUID();
	await db.batch([
		db
			.prepare(
				`INSERT INTO products (id, slug, name, category, price_bdt)
				 VALUES (?, ?, ?, ?, ?)`
			)
			.bind(id, input.slug, input.name.trim(), input.category, input.price_bdt),
		db.prepare(`INSERT INTO inventory (product_id, state) VALUES (?, 'available')`).bind(id)
	]);
	return { id, slug: input.slug, publication_state: 'draft' as const };
}

type DraftDetails = {
	name: string;
	category: DraftInput['category'];
	price_bdt: number;
	brand: string | null;
	description: string | null;
	condition_notes: string | null;
	size_label: string | null;
	measurements_json: string | null;
	fit_note: string | null;
};

function isDraftDetails(value: unknown): value is DraftDetails {
	if (!value || typeof value !== 'object') return false;
	const input = value as Record<string, unknown>;
	const optional = ['brand', 'description', 'condition_notes', 'size_label', 'fit_note'];
	if (
		!optional.every(
			(key) => input[key] === null || (typeof input[key] === 'string' && input[key].length <= 4000)
		)
	)
		return false;
	if (input.measurements_json !== null) {
		if (typeof input.measurements_json !== 'string' || input.measurements_json.length > 2000)
			return false;
		try {
			const parsed: unknown = JSON.parse(input.measurements_json);
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
		} catch {
			return false;
		}
	}
	return (
		typeof input.name === 'string' &&
		input.name.trim().length > 0 &&
		input.name.length <= 160 &&
		['tops', 'bottoms', 'outerwear', 'dresses'].includes(String(input.category)) &&
		Number.isSafeInteger(input.price_bdt) &&
		(input.price_bdt as number) > 0
	);
}

export async function updateDraftDetails(
	db: {
		prepare(sql: string): {
			bind(...values: (string | number | null)[]): {
				run(): Promise<{ meta?: { changes: number }; changes?: number | bigint }>;
			};
		};
	},
	id: string,
	input: unknown
) {
	if (!isDraftDetails(input)) throw new Error('Invalid details');
	const result = await db
		.prepare(
			`UPDATE products SET name = ?, category = ?, price_bdt = ?, brand = ?,
			 description = ?, condition_notes = ?, size_label = ?, measurements_json = ?, fit_note = ?
			 WHERE id = ? AND publication_state = 'draft'`
		)
		.bind(
			input.name.trim(),
			input.category,
			input.price_bdt,
			input.brand?.trim() || null,
			input.description?.trim() || null,
			input.condition_notes?.trim() || null,
			input.size_label?.trim() || null,
			input.measurements_json,
			input.fit_note?.trim() || null,
			id
		)
		.run();
	if ((result.meta?.changes ?? result.changes ?? 0) !== 1) throw new Error('Draft not found');
	return { id, publication_state: 'draft' as const };
}

type PublicationDb = {
	prepare(sql: string): {
		bind(...values: string[]): {
			first(): Promise<Record<string, unknown> | null>;
			all(): Promise<{ results: Record<string, unknown>[] }>;
			run(): Promise<{ meta?: { changes: number }; changes?: number | bigint }>;
		};
	};
};

const changed = (result: { meta?: { changes: number }; changes?: number | bigint }) =>
	Number(result.meta?.changes ?? result.changes ?? 0) === 1;

export async function publishProduct(db: PublicationDb, id: string) {
	const product = await db
		.prepare(
			`SELECT p.name, p.category, p.price_bdt, p.description, p.condition_notes,
		 p.size_label, p.measurements_json, p.fit_note FROM products AS p
		 JOIN inventory AS i ON i.product_id = p.id
		 WHERE p.id = ? AND p.publication_state = 'draft' AND i.state = 'available'`
		)
		.bind(id)
		.first();
	if (!product) throw new Error('Draft not available');
	const { results: photos } = await db
		.prepare(`SELECT r2_key, alt_text FROM product_photos WHERE product_id = ? ORDER BY position`)
		.bind(id)
		.all();
	if (
		publicationErrors(
			product as Parameters<typeof publicationErrors>[0],
			photos as Parameters<typeof publicationErrors>[1]
		).length
	)
		throw new Error('Incomplete product');
	const result = await db
		.prepare(
			`UPDATE products SET publication_state = 'published'
		 WHERE id = ? AND publication_state = 'draft'
		 AND EXISTS (SELECT 1 FROM inventory WHERE product_id = ? AND state = 'available')
		 AND trim(name) != '' AND price_bdt > 0
		 AND trim(coalesce(description, '')) != ''
		 AND trim(coalesce(condition_notes, '')) != ''
		 AND trim(coalesce(size_label, '')) != ''
		 AND trim(coalesce(fit_note, '')) != ''
		 AND (SELECT count(*) FROM product_photos WHERE product_id = ?) BETWEEN 1 AND 8
		 AND NOT EXISTS (SELECT 1 FROM product_photos WHERE product_id = ?
		   AND (trim(r2_key) = '' OR trim(alt_text) = ''))
		 AND measurements_json IS NOT NULL
		 AND CASE WHEN category = 'bottoms' THEN
		   json_type(measurements_json, '$.waist_cm') IN ('integer', 'real')
		   AND json_extract(measurements_json, '$.waist_cm') > 0
		   AND json_type(measurements_json, '$.inseam_cm') IN ('integer', 'real')
		   AND json_extract(measurements_json, '$.inseam_cm') > 0
		 ELSE
		   json_type(measurements_json, '$.chest_cm') IN ('integer', 'real')
		   AND json_extract(measurements_json, '$.chest_cm') > 0
		   AND json_type(measurements_json, '$.length_cm') IN ('integer', 'real')
		   AND json_extract(measurements_json, '$.length_cm') > 0 END`
		)
		.bind(id, id, id, id)
		.run();
	if (!changed(result)) throw new Error('Draft changed; retry publication');
	return { id, publication_state: 'published' as const };
}

export async function unpublishProduct(db: PublicationDb, id: string) {
	const result = await db
		.prepare(
			`UPDATE products SET publication_state = 'draft'
		 WHERE id = ? AND publication_state = 'published'
		 AND EXISTS (SELECT 1 FROM inventory WHERE product_id = ? AND state = 'available')`
		)
		.bind(id, id)
		.run();
	if (!changed(result)) throw new Error('Product not available');
	return { id, publication_state: 'draft' as const };
}
