import { expect, it, vi } from 'vitest';
import { runMonitoredBackup } from './monitor';

it('emails the owner when a scheduled D1 backup fails and preserves the failure', async () => {
	const send = vi.fn(async () => ({ messageId: 'alert-1' }));
	const put = vi.fn();
	const list = vi.fn(async () => ({ objects: [], truncated: false }));
	const fetcher = vi.fn(async () => Response.json({ success: true }));
	const step = {
		do: async <T>(_name: string, callback: () => Promise<T>) => callback(),
		sleep: vi.fn()
	};

	await expect(
		runMonitoredBackup(
			{
				ACCOUNT_ID: 'account-1',
				DATABASE_ID: 'database-1',
				D1_REST_API_TOKEN: undefined,
				BACKUP_BUCKET: { put, list },
				EMAIL: { send },
				ALERT_EMAIL: 'owner@example.com',
				ALERT_FROM_EMAIL: 'alerts@example.com'
			},
			step,
			new Date('2026-10-05T01:00:00.000Z'),
			fetcher
		)
	).rejects.toThrow('Missing D1 export token');
	expect(send).toHaveBeenCalledExactlyOnceWith({
		to: 'owner@example.com',
		from: 'alerts@example.com',
		subject: 'dathrift development backup failed',
		text: 'The scheduled nonproduction D1 backup failed at 2026-10-05T01:00:00.000Z. Inspect the backup Workflow logs.'
	});
	expect(fetcher).not.toHaveBeenCalled();
	expect(put).not.toHaveBeenCalled();
});

it('emails the owner when the previous private backup is older than one hour', async () => {
	const send = vi.fn(async () => ({ messageId: 'alert-2' }));
	const put = vi.fn();
	const list = vi.fn(async () => ({
		objects: [{ customMetadata: { scheduled_at: '2026-10-05T00:30:00.000Z' } }],
		truncated: false
	}));
	const fetcher = vi.fn(async (input: string | URL | Request) =>
		String(input) === 'https://download.example/backup.sql'
			? new Response('CREATE TABLE foundation_markers (id TEXT);')
			: Response.json({
					success: true,
					result: {
						success: true,
						at_bookmark: 'bookmark-2',
						status: 'complete',
						result: { signed_url: 'https://download.example/backup.sql' }
					}
				})
	);
	const step = {
		do: async <T>(_name: string, callback: () => Promise<T>) => callback(),
		sleep: vi.fn()
	};

	await expect(
		runMonitoredBackup(
			{
				ACCOUNT_ID: 'account-1',
				DATABASE_ID: 'database-1',
				D1_REST_API_TOKEN: 'test-token',
				BACKUP_BUCKET: { put, list },
				EMAIL: { send },
				ALERT_EMAIL: 'owner@example.com',
				ALERT_FROM_EMAIL: 'alerts@example.com'
			},
			step,
			new Date('2026-10-05T01:00:00.000Z'),
			fetcher,
			new Date('2026-10-05T01:45:00.000Z')
		)
	).resolves.toEqual(['hourly/2026-10-05T01-00-00Z.sql']);
	expect(list).toHaveBeenCalledExactlyOnceWith({ prefix: 'hourly/', include: ['customMetadata'] });
	expect(put).toHaveBeenCalledOnce();
	expect(send).toHaveBeenCalledExactlyOnceWith({
		to: 'owner@example.com',
		from: 'alerts@example.com',
		subject: 'dathrift development backup stale',
		text: 'The latest previous nonproduction D1 backup was over one hour old at 2026-10-05T01:45:00.000Z. Inspect the backup Workflow and private R2 bucket.'
	});
});

it('does not start a backup without both alert addresses', async () => {
	const send = vi.fn();
	const put = vi.fn();
	const list = vi.fn();
	const fetcher = vi.fn();
	const step = {
		do: async <T>(_name: string, callback: () => Promise<T>) => callback(),
		sleep: vi.fn()
	};

	await expect(
		runMonitoredBackup(
			{
				ACCOUNT_ID: 'account-1',
				DATABASE_ID: 'database-1',
				D1_REST_API_TOKEN: 'test-token',
				BACKUP_BUCKET: { put, list },
				EMAIL: { send },
				ALERT_EMAIL: '',
				ALERT_FROM_EMAIL: 'alerts@example.com'
			},
			step,
			new Date('2026-10-05T02:00:00.000Z'),
			fetcher
		)
	).rejects.toThrow('Missing backup alert configuration');
	expect(list).not.toHaveBeenCalled();
	expect(fetcher).not.toHaveBeenCalled();
	expect(put).not.toHaveBeenCalled();
	expect(send).not.toHaveBeenCalled();
});
