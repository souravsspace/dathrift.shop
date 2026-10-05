import { runScheduledBackup, type BackupEnv } from './backup';

type MonitorEnv = BackupEnv & {
	BACKUP_BUCKET: BackupEnv['BACKUP_BUCKET'] & {
		list(options: { prefix: string; include: string[]; cursor?: string }): Promise<{
			objects: { customMetadata?: Record<string, string> }[];
			truncated: boolean;
			cursor?: string;
		}>;
	};
	EMAIL: {
		send(message: { to: string; from: string; subject: string; text: string }): Promise<unknown>;
	};
	ALERT_EMAIL: string;
	ALERT_FROM_EMAIL: string;
};

export async function runMonitoredBackup(
	env: MonitorEnv,
	step: Parameters<typeof runScheduledBackup>[1],
	scheduledAt: Date,
	fetcher: typeof fetch = fetch
): Promise<string[]> {
	let latestPreviousBackup: number | null;
	let keys: string[];
	try {
		latestPreviousBackup = await step.do('Inspect previous private backup', async () => {
			let latest: number | null = null;
			let cursor: string | undefined;
			for (;;) {
				const page = await env.BACKUP_BUCKET.list({
					prefix: 'hourly/',
					include: ['customMetadata'],
					...(cursor ? { cursor } : {})
				});
				for (const object of page.objects) {
					const time = Date.parse(object.customMetadata?.scheduled_at ?? '');
					if (Number.isFinite(time) && (latest === null || time > latest)) latest = time;
				}
				if (!page.truncated) return latest;
				if (!page.cursor) throw new Error('R2 backup list was truncated without a cursor');
				cursor = page.cursor;
			}
		});
		keys = await runScheduledBackup(env, step, scheduledAt, fetcher);
	} catch (error) {
		await step.do('Email backup failure alert', () =>
			env.EMAIL.send({
				to: env.ALERT_EMAIL,
				from: env.ALERT_FROM_EMAIL,
				subject: 'dathrift Phase 1 backup failed',
				text: `The scheduled nonproduction D1 backup failed at ${scheduledAt.toISOString()}. Inspect the Phase 1 Workflow logs.`
			})
		);
		throw error;
	}
	if (
		latestPreviousBackup === null ||
		scheduledAt.getTime() - latestPreviousBackup > 60 * 60 * 1000
	) {
		await step.do('Email stale backup alert', () =>
			env.EMAIL.send({
				to: env.ALERT_EMAIL,
				from: env.ALERT_FROM_EMAIL,
				subject: 'dathrift Phase 1 backup stale',
				text: `The latest previous nonproduction D1 backup was over one hour old at ${scheduledAt.toISOString()}. Inspect the Phase 1 Workflow and private R2 bucket.`
			})
		);
	}
	return keys;
}
