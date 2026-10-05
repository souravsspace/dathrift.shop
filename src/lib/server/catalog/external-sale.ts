import type { Database } from '../db/client';
import { externalSales } from '../db/schema';

// A D1 trigger allows this insert only while the unit is available, then marks it sold.
export async function markSoldExternally(
	db: Database,
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
	await db.insert(externalSales).values({
		id: crypto.randomUUID(),
		productId,
		actorEmail: actorEmail.trim(),
		reason: reason.trim()
	});
	return { product_id: productId, state: 'sold' as const };
}
