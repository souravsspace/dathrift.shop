type Statement = {
	first(): Promise<Record<string, unknown> | null>;
	run(): Promise<{ meta: { changes: number } }>;
};
export type OrderDb = {
	prepare(sql: string): { bind(...values: (string | number | null)[]): Statement };
	batch(statements: Statement[]): Promise<{ meta: { changes: number } }[]>;
};

export type OrderStatus = 'pending_payment' | 'paid' | 'payment_review' | 'cancelled' | 'expired';

export async function attachPayment(
	db: OrderDb,
	orderId: string,
	provider: 'bkash' | 'mock',
	paymentId: string,
	amountBdt: number,
	redirectUrl: string | null = null
) {
	await db
		.prepare(
			`INSERT INTO payments (payment_id, order_id, provider, amount_bdt, redirect_url)
		 VALUES (?, ?, ?, ?, ?)`
		)
		.bind(paymentId, orderId, provider, amountBdt, redirectUrl)
		.run();
}

async function orderStatus(db: OrderDb, orderId: string) {
	const row = await db.prepare('SELECT status FROM orders WHERE id = ?').bind(orderId).first();
	if (!row) throw new Error('Unknown order');
	return row.status as OrderStatus;
}

// Call only after the provider has verified a completed payment for this exact payment ID.
export async function settleVerifiedPayment(
	db: OrderDb,
	paymentId: string,
	trxId: string
): Promise<OrderStatus> {
	const payment = await db
		.prepare('SELECT order_id FROM payments WHERE payment_id = ?')
		.bind(paymentId)
		.first();
	if (!payment) throw new Error('Unknown payment');
	const orderId = payment.order_id as string;
	const completePayment = () =>
		db
			.prepare(
				`UPDATE payments SET status = 'completed', trx_id = ?, updated_at = CURRENT_TIMESTAMP
			 WHERE payment_id = ? AND (trx_id IS NULL OR trx_id = ?)`
			)
			.bind(trxId, paymentId, trxId);
	const toReview = () =>
		db.batch([
			completePayment(),
			db
				.prepare(
					`UPDATE orders SET status = 'payment_review'
				 WHERE id = ? AND status IN ('pending_payment', 'expired', 'cancelled')`
				)
				.bind(orderId)
		]);

	const current = await orderStatus(db, orderId);
	if (current === 'pending_payment' || current === 'payment_review') {
		try {
			await db.batch([
				completePayment(),
				db
					.prepare(
						`UPDATE orders SET status = 'paid'
					 WHERE id = ? AND status IN ('pending_payment', 'payment_review')`
					)
					.bind(orderId)
			]);
		} catch (error) {
			if (!(error instanceof Error) || !error.message.includes('Units not held')) throw error;
			await toReview();
		}
	} else if (current !== 'paid') {
		await toReview();
	}
	return orderStatus(db, orderId);
}

// Releases held units. Without an actor only an unpaid pending order closes; the owner may
// also close a payment review after checking provider records.
export async function closeUnpaidOrder(
	db: OrderDb,
	orderId: string,
	to: 'cancelled' | 'expired',
	actor?: string
): Promise<boolean> {
	const from = actor ? ['pending_payment', 'payment_review'] : ['pending_payment'];
	const placeholders = from.map(() => '?').join(', ');
	const statements = [
		db
			.prepare(`UPDATE orders SET status = ? WHERE id = ? AND status IN (${placeholders})`)
			.bind(to, orderId, ...from),
		db
			.prepare(
				`UPDATE payments SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
			 WHERE order_id = ? AND status = 'created'
			 AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND status = ?)`
			)
			.bind(orderId, orderId, to)
	];
	if (actor)
		statements.push(
			db
				.prepare(
					`INSERT INTO order_events (order_id, actor, action)
				 SELECT ?, ?, 'closed_by_staff' WHERE EXISTS (SELECT 1 FROM orders WHERE id = ? AND status = ?)`
				)
				.bind(orderId, actor, orderId, to)
		);
	const [closed] = await db.batch(statements);
	return closed.meta.changes > 0;
}

export async function holdForReview(db: OrderDb, orderId: string): Promise<boolean> {
	const result = await db
		.prepare(
			`UPDATE orders SET status = 'payment_review' WHERE id = ? AND status = 'pending_payment'`
		)
		.bind(orderId)
		.run();
	return result.meta.changes > 0;
}
