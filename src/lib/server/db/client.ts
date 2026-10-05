import type { D1Database } from '@cloudflare/workers-types';
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

export type Database = DrizzleD1Database<typeof schema>;

// D1 rejects BEGIN/COMMIT, so never use db.transaction(); group writes with db.batch().
export const database = (d1: D1Database): Database => drizzle(d1 as never, { schema });

export function databaseFrom(env: unknown): Database | null {
	const d1 = (env as { DB?: D1Database }).DB;
	return d1 ? database(d1) : null;
}
