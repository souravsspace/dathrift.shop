/// <reference types="@cloudflare/workers-types" />
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import { runMonitoredBackup } from './monitor';

export class Phase1BackupWorkflow extends WorkflowEntrypoint<
	Parameters<typeof runMonitoredBackup>[0]
> {
	async run(event: WorkflowEvent<unknown>, step: WorkflowStep): Promise<void> {
		if (!event.schedule) throw new Error('Phase 1 backup must run from its schedule');
		await runMonitoredBackup(this.env, step, new Date(event.schedule.scheduledTime));
	}
}
