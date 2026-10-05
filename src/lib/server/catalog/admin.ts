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
