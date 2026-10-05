// Test-only D1-shaped wrapper over in-memory SQLite with the shop migrations and local seed.
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

type Value = string | number | null;

export type LocalStatement = {
	first(): Promise<Record<string, unknown> | null>;
	all(): Promise<{ results: Record<string, unknown>[] }>;
	run(): Promise<{ meta: { changes: number } }>;
	execute(): { results: Record<string, unknown>[]; meta: { changes: number } };
};

export function localD1({ seed = true } = {}) {
	const sqlite = new DatabaseSync(':memory:');
	sqlite.exec('PRAGMA foreign_keys = ON');
	for (const file of readdirSync('db/migrations').sort())
		sqlite.exec(readFileSync(`db/migrations/${file}`, 'utf8'));
	if (seed) sqlite.exec(readFileSync('db/seed/local.sql', 'utf8'));

	const statement = (sql: string, args: Value[]): LocalStatement => {
		const execute = () => {
			const prepared = sqlite.prepare(sql);
			if (/^\s*(SELECT|WITH)\b/i.test(sql) || /\bRETURNING\b/i.test(sql))
				return { results: prepared.all(...args) as Record<string, unknown>[], meta: { changes: 0 } };
			const { changes } = prepared.run(...args);
			return { results: [], meta: { changes: Number(changes) } };
		};
		return {
			first: async () => execute().results[0] ?? null,
			all: async () => ({ results: execute().results }),
			run: async () => ({ meta: execute().meta }),
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
