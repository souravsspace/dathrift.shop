/// <reference types="@cloudflare/workers-types" />
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import { runScheduledBackup, type BackupEnv } from './backup';

export class Phase1BackupWorkflow extends WorkflowEntrypoint<BackupEnv> {
	async run(event: WorkflowEvent<unknown>, step: WorkflowStep): Promise<void> {
		if (!event.schedule) throw new Error('Phase 1 backup must run from its schedule');
		await runScheduledBackup(this.env, step, new Date(event.schedule.scheduledTime));
	}
}
