// Test-only D1-shaped wrapper over in-memory SQLite with the shop migrations and local seed.
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { D1Database } from '@cloudflare/workers-types';
import { database } from '../db/client';

type Value = string | number | null;

export type LocalStatement = {
	first(): Promise<Record<string, unknown> | null>;
	all(): Promise<{ results: Record<string, unknown>[] }>;
	run(): Promise<{ meta: { changes: number } }>;
	raw(): Promise<unknown[][]>;
	execute(): { results: Record<string, unknown>[]; meta: { changes: number } };
};

export function localD1({ seed = true, migrations = 'db/migrations' } = {}) {
	const sqlite = new DatabaseSync(':memory:');
	sqlite.exec('PRAGMA foreign_keys = ON');
	for (const file of readdirSync(migrations).sort())
		sqlite.exec(readFileSync(`${migrations}/${file}`, 'utf8'));
	if (seed) sqlite.exec(readFileSync('db/seed/local.sql', 'utf8'));

	const statement = (sql: string, args: Value[]): LocalStatement => {
		const execute = () => {
			const prepared = sqlite.prepare(sql);
			if (/^\s*(SELECT|WITH)\b/i.test(sql) || /\bRETURNING\b/i.test(sql))
				return {
					results: prepared.all(...args) as Record<string, unknown>[],
					meta: { changes: 0 }
				};
			const { changes } = prepared.run(...args);
			return { results: [], meta: { changes: Number(changes) } };
		};
		return {
			first: async () => execute().results[0] ?? null,
			all: async () => ({ results: execute().results }),
			run: async () => ({ meta: execute().meta }),
			raw: async () => {
				const prepared = sqlite.prepare(sql);
				prepared.setReturnArrays(true);
				return prepared.all(...args) as unknown as unknown[][];
			},
			execute
		};
	};

	const db = {
		prepare: (sql: string) => ({
			...statement(sql, []),
			bind: (...args: Value[]) => statement(sql, args)
		}),
		batch: async (statements: LocalStatement[]) => {
			sqlite.exec('BEGIN');
			try {
				const results = statements.map((item) => item.execute());
				sqlite.exec('COMMIT');
				return results;
			} catch (error) {
				sqlite.exec('ROLLBACK');
				throw error;
			}
		}
	};
	return { db, sqlite };
}

// Drizzle over the same SQLite stand-in, so tests exercise real migrations and triggers.
export function localDatabase(options?: { seed?: boolean }) {
	const local = localD1(options);
	return { ...local, d1: local.db, db: database(local.db as unknown as D1Database) };
}
