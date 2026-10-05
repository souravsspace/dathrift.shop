import { runScheduledBackup, type BackupEnv } from './backup';

type MonitorEnv = BackupEnv & {
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
	try {
		return await runScheduledBackup(env, step, scheduledAt, fetcher);
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
}
