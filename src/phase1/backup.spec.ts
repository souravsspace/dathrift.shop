import { expect, it, vi } from 'vitest';
import { runScheduledBackup } from './backup';

it('stores hourly and midnight daily SQL exports from a scheduled D1 snapshot', async () => {
	const apiResponses = [
		{ success: true, result: { success: true, at_bookmark: 'bookmark-1' } },
		{ success: true, result: { success: true, at_bookmark: 'bookmark-1' } },
		{
			success: true,
			result: {
				success: true,
				status: 'complete',
				result: { signed_url: 'https://download.example/backup.sql' }
			}
		}
	];
	const fetcher = vi.fn(async (input: string | URL | Request) => {
		if (String(input) === 'https://download.example/backup.sql') {
			return new Response('CREATE TABLE phase1_markers (id TEXT);', { status: 200 });
		}
		return Response.json(apiResponses.shift());
	});
	const objects = new Map<string, string>();
	const put = vi.fn(async (key: string, body: ReadableStream) => {
		objects.set(key, await new Response(body).text());
	});
	const sleep = vi.fn(async () => {});
	const step = { do: async <T>(_name: string, callback: () => Promise<T>) => callback(), sleep };

	const keys = await runScheduledBackup(
		{
			ACCOUNT_ID: 'account-1',
			DATABASE_ID: 'database-1',
			D1_REST_API_TOKEN: 'test-token',
			BACKUP_BUCKET: { put }
		},
		step,
		new Date('2026-10-05T00:00:00.000Z'),
		fetcher
	);

	expect(keys).toEqual(['hourly/2026-10-05T00-00-00Z.sql', 'daily/2026-10-05T00-00-00Z.sql']);
	expect([...objects.values()]).toEqual([
		'CREATE TABLE phase1_markers (id TEXT);',
		'CREATE TABLE phase1_markers (id TEXT);'
	]);
	expect(sleep).toHaveBeenCalledOnce();
	expect(fetcher).toHaveBeenCalledTimes(5);
});

it('does not call the D1 API without a configured export token', async () => {
	const fetcher = vi.fn(async () => Response.json({ success: true }));
	const put = vi.fn();
	const step = {
		do: async <T>(_name: string, callback: () => Promise<T>) => callback(),
		sleep: vi.fn()
	};

	await expect(
		runScheduledBackup(
			{
				ACCOUNT_ID: 'account-1',
				DATABASE_ID: 'database-1',
				D1_REST_API_TOKEN: undefined,
				BACKUP_BUCKET: { put }
			},
			step,
			new Date('2026-10-05T01:00:00.000Z'),
			fetcher
		)
	).rejects.toThrow('Missing D1 export token');
	expect(fetcher).not.toHaveBeenCalled();
	expect(put).not.toHaveBeenCalled();
});

it('does not store a backup when D1 reports an export failure', async () => {
	const fetcher = vi.fn(async () =>
		Response.json({
			success: true,
			result: {
				success: false,
				at_bookmark: 'bookmark-1',
				status: 'complete',
				result: { signed_url: 'https://download.example/invalid.sql' }
			}
		})
	);
	const put = vi.fn();
	const step = {
		do: async <T>(_name: string, callback: () => Promise<T>) => callback(),
		sleep: vi.fn()
	};

	await expect(
		runScheduledBackup(
			{
				ACCOUNT_ID: 'account-1',
				DATABASE_ID: 'database-1',
				D1_REST_API_TOKEN: 'test-token',
				BACKUP_BUCKET: { put }
			},
			step,
			new Date('2026-10-05T01:00:00.000Z'),
			fetcher
		)
	).rejects.toThrow('D1 export failed');
	expect(fetcher).toHaveBeenCalledOnce();
	expect(put).not.toHaveBeenCalled();
});
