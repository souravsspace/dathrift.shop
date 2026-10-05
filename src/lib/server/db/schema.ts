// Typed mirror of db/migrations. The SQL migrations (and their triggers) remain the source of truth.
import { sql } from 'drizzle-orm';
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
	slug: text('slug').primaryKey(),
	name: text('name').notNull().unique(),
	measurementSet: text('measurement_set', { enum: ['top', 'bottom', 'none'] }).notNull(),
	createdAt: text('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

export const products = sqliteTable('products', {
	id: text('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull(),
	category: text('category')
		.notNull()
		.references(() => categories.slug),
	priceBdt: integer('price_bdt').notNull(),
	publicationState: text('publication_state', { enum: ['draft', 'published'] })
		.notNull()
		.default('draft'),
	createdAt: text('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	brand: text('brand'),
	description: text('description'),
	conditionNotes: text('condition_notes'),
	sizeLabel: text('size_label'),
	measurementsJson: text('measurements_json'),
	fitNote: text('fit_note'),
	updatedAt: text('updated_at')
});

export const inventory = sqliteTable('inventory', {
	productId: text('product_id')
		.primaryKey()
		.references(() => products.id),
	state: text('state', { enum: ['available', 'reserved', 'sold'] })
		.notNull()
		.default('available'),
	reservedOrderId: text('reserved_order_id').references(() => orders.id)
});

export const productPhotos = sqliteTable(
	'product_photos',
	{
		productId: text('product_id')
			.notNull()
			.references(() => products.id),
		position: integer('position').notNull(),
		r2Key: text('r2_key').notNull().unique(),
		altText: text('alt_text').notNull()
	},
	(table) => [primaryKey({ columns: [table.productId, table.position] })]
);

export const externalSales = sqliteTable('external_sales', {
	id: text('id').primaryKey(),
	productId: text('product_id')
		.notNull()
		.unique()
		.references(() => products.id),
	actorEmail: text('actor_email').notNull(),
	reason: text('reason').notNull(),
	createdAt: text('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

export const deliveryAreas = sqliteTable(
	'delivery_areas',
	{
		districtKey: text('district_key').notNull(),
		areaKey: text('area_key').notNull(),
		displayName: text('display_name').notNull(),
		feeBdt: integer('fee_bdt').notNull(),
		previewOnly: integer('preview_only', { mode: 'boolean' }).notNull().default(false),
		active: integer('active', { mode: 'boolean' }).notNull().default(true)
	},
	(table) => [primaryKey({ columns: [table.districtKey, table.areaKey] })]
);

export const orderStatuses = [
	'pending_payment',
	'paid',
	'payment_review',
	'cancelled',
	'expired'
] as const;

export const orders = sqliteTable('orders', {
	id: text('id').primaryKey(),
	statusToken: text('status_token').notNull().unique(),
	status: text('status', { enum: orderStatuses }).notNull().default('pending_payment'),
	addressJson: text('address_json').notNull(),
	shippingBdt: integer('shipping_bdt').notNull(),
	subtotalBdt: integer('subtotal_bdt').notNull().default(0),
	totalBdt: integer('total_bdt').notNull(),
	previewOnly: integer('preview_only', { mode: 'boolean' }).notNull().default(false),
	createdAt: text('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	expiresAt: text('expires_at')
		.notNull()
		.default(sql`(datetime('now', '+15 minutes'))`),
	checkoutKey: text('checkout_key').unique()
});

export const orderItems = sqliteTable(
	'order_items',
	{
		orderId: text('order_id')
			.notNull()
			.references(() => orders.id),
		productId: text('product_id')
			.notNull()
			.references(() => products.id),
		priceBdt: integer('price_bdt').notNull()
	},
	(table) => [primaryKey({ columns: [table.orderId, table.productId] })]
);

export const payments = sqliteTable('payments', {
	paymentId: text('payment_id').primaryKey(),
	orderId: text('order_id')
		.notNull()
		.unique()
		.references(() => orders.id),
	provider: text('provider', { enum: ['bkash', 'mock'] }).notNull(),
	amountBdt: integer('amount_bdt').notNull(),
	status: text('status', { enum: ['created', 'completed', 'failed', 'cancelled'] })
		.notNull()
		.default('created'),
	trxId: text('trx_id').unique(),
	redirectUrl: text('redirect_url'),
	createdAt: text('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

export const orderEvents = sqliteTable('order_events', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	orderId: text('order_id')
		.notNull()
		.references(() => orders.id),
	actor: text('actor').notNull().default('system'),
	action: text('action').notNull(),
	note: text('note'),
	createdAt: text('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

export const paymentTokens = sqliteTable('payment_tokens', {
	provider: text('provider').primaryKey(),
	idToken: text('id_token').notNull(),
	refreshToken: text('refresh_token').notNull(),
	expiresAt: integer('expires_at').notNull(),
	refreshExpiresAt: integer('refresh_expires_at').notNull()
});

export const fulfillments = sqliteTable('fulfillments', {
	orderId: text('order_id')
		.primaryKey()
		.references(() => orders.id),
	state: text('state', { enum: ['preparing', 'dispatched', 'delivered'] }).notNull(),
	courier: text('courier'),
	trackingCode: text('tracking_code'),
	actorEmail: text('actor_email').notNull(),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

export const slugRedirects = sqliteTable('slug_redirects', {
	oldSlug: text('old_slug').primaryKey(),
	productId: text('product_id')
		.notNull()
		.references(() => products.id),
	createdAt: text('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

export const homeFeature = sqliteTable('home_feature', {
	slot: text('slot', { enum: ['hero'] }).primaryKey(),
	productId: text('product_id')
		.notNull()
		.references(() => products.id),
	featuredAt: text('featured_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});
