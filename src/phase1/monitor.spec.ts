import { expect, it, vi } from 'vitest';
import { runMonitoredBackup } from './monitor';

it('emails the owner when a scheduled D1 backup fails and preserves the failure', async () => {
	const send = vi.fn(async () => ({ messageId: 'alert-1' }));
	const put = vi.fn();
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
				BACKUP_BUCKET: { put },
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
		subject: 'dathrift Phase 1 backup failed',
		text: 'The scheduled nonproduction D1 backup failed at 2026-10-05T01:00:00.000Z. Inspect the Phase 1 Workflow logs.'
	});
	expect(fetcher).not.toHaveBeenCalled();
	expect(put).not.toHaveBeenCalled();
});
