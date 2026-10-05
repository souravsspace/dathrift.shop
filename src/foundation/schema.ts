// Typed mirror of db/foundation for the disposable nonproduction proof Worker.
import { sql } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const foundationMarkers = sqliteTable('foundation_markers', {
	id: text('id').primaryKey(),
	value: text('value').notNull(),
	createdAt: text('created_at')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});
