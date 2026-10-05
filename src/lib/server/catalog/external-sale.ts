type SaleDb = {
	prepare(sql: string): {
		bind(...values: string[]): { run(): Promise<unknown> };
	};
};

export async function markSoldExternally(
	db: SaleDb,
	productId: string,
	actorEmail: string,
	reason: string
) {
	if (
		!productId ||
		!actorEmail.trim() ||
		actorEmail.length > 320 ||
		!reason.trim() ||
		reason.length > 1000
	)
		throw new Error('Invalid sale');
	await db
		.prepare(
			`INSERT INTO external_sales (id, product_id, actor_email, reason)
		 VALUES (?, ?, ?, ?)`
		)
		.bind(crypto.randomUUID(), productId, actorEmail.trim(), reason.trim())
		.run();
	return { product_id: productId, state: 'sold' as const };
}
