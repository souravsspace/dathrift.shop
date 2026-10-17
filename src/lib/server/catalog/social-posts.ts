import { and, eq, isNull, sql } from 'drizzle-orm';
import { isCaptionVariant } from '../../social/captions';
import { isSocialFormat, MAX_SOCIAL_TEXT } from '../../social/formats';
import type { Database } from '../db/client';
import { productSocialPosts, products } from '../db/schema';

export type SavedSocialPost = {
	format: string;
	variant: string;
	caption: string;
	basis: string;
	updated_at: string;
};

const columns = {
	format: productSocialPosts.format,
	variant: productSocialPosts.variant,
	caption: productSocialPosts.caption,
	basis: productSocialPosts.basis,
	updated_at: productSocialPosts.updatedAt
};

const validId = (id: string) => /^[a-zA-Z0-9-]{1,80}$/.test(id);

// Stories and Marketplace have a single text, stored as the classic variant.
const variantOf = (value: unknown) => (value === undefined ? 'classic' : value);

export async function listSocialPosts(db: Database, id: string): Promise<SavedSocialPost[]> {
	if (!validId(id)) return [];
	return db.select(columns).from(productSocialPosts).where(eq(productSocialPosts.productId, id));
}

// Saves the staff-edited caption for one format and variant, replacing any earlier edit.
export async function saveSocialPost(
	db: Database,
	id: string,
	input: { format: unknown; variant?: unknown; caption: unknown; basis: unknown }
): Promise<SavedSocialPost> {
	const { format, caption, basis } = input;
	const variant = variantOf(input.variant);
	if (
		!validId(id) ||
		!isSocialFormat(format) ||
		!isCaptionVariant(variant) ||
		typeof caption !== 'string' ||
		!caption.trim() ||
		caption.length > MAX_SOCIAL_TEXT ||
		typeof basis !== 'string' ||
		basis.length > MAX_SOCIAL_TEXT
	)
		throw new Error('Invalid caption');
	const product = await db
		.select({ id: products.id })
		.from(products)
		.where(and(eq(products.id, id), isNull(products.archivedAt)))
		.get();
	if (!product) throw new Error('Product not found');
	const [saved] = await db
		.insert(productSocialPosts)
		.values({ productId: id, format, variant, caption, basis })
		.onConflictDoUpdate({
			target: [productSocialPosts.productId, productSocialPosts.format, productSocialPosts.variant],
			set: { caption, basis, updatedAt: sql`CURRENT_TIMESTAMP` }
		})
		.returning(columns);
	return saved;
}

// Dropping the edit sends that format and variant back to the generated caption.
export async function resetSocialPost(
	db: Database,
	id: string,
	input: { format: unknown; variant?: unknown }
) {
	const { format } = input;
	const variant = variantOf(input.variant);
	if (!validId(id) || !isSocialFormat(format) || !isCaptionVariant(variant))
		throw new Error('Invalid caption');
	await db
		.delete(productSocialPosts)
		.where(
			and(
				eq(productSocialPosts.productId, id),
				eq(productSocialPosts.format, format),
				eq(productSocialPosts.variant, variant)
			)
		);
	return { format, variant };
}
