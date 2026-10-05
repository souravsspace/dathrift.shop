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
