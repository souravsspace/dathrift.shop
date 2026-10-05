export type BackupEnv = {
	ACCOUNT_ID: string;
	DATABASE_ID: string;
	D1_REST_API_TOKEN?: string;
	BACKUP_BUCKET: {
		put(
			key: string,
			body: ReadableStream,
			options: { customMetadata: Record<string, string> }
		): Promise<unknown>;
	};
};

type BackupStep = {
	do<T>(name: string, callback: () => Promise<T>): Promise<T>;
	sleep(name: string, duration: '10 seconds'): Promise<void>;
};

type ExportResult = {
	at_bookmark?: string;
	status?: 'complete' | 'error';
	error?: string;
	result?: { signed_url?: string };
};

export async function runScheduledBackup(
	env: BackupEnv,
	step: BackupStep,
	scheduledAt: Date,
	fetcher: typeof fetch = fetch
): Promise<string[]> {
	if (!env.D1_REST_API_TOKEN) throw new Error('Missing D1 export token');
	const url = `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/d1/database/${env.DATABASE_ID}/export`;
	const requestExport = async (bookmark?: string): Promise<ExportResult> => {
		const response = await fetcher(url, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.D1_REST_API_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(
				bookmark
					? { output_format: 'polling', current_bookmark: bookmark }
					: { output_format: 'polling' }
			)
		});
		if (!response.ok) throw new Error(`D1 export HTTP ${response.status}`);
		const body = (await response.json()) as { success?: boolean; result?: ExportResult };
		if (!body.success || !body.result || body.result.status === 'error') {
			throw new Error(`D1 export failed: ${body.result?.error ?? 'unknown error'}`);
		}
		return body.result;
	};

	const started = await step.do('Start D1 export', () => requestExport());
	if (!started.at_bookmark) throw new Error('D1 export did not return a bookmark');

	let signedUrl = started.result?.signed_url;
	for (let attempt = 0; !signedUrl && attempt < 30; attempt++) {
		const progress = await step.do(`Poll D1 export ${attempt + 1}`, () =>
			requestExport(started.at_bookmark)
		);
		signedUrl = progress.result?.signed_url;
		if (!signedUrl && attempt < 29)
			await step.sleep(`Wait for D1 export ${attempt + 1}`, '10 seconds');
	}
	if (!signedUrl) throw new Error('D1 export did not complete within five minutes');

	const stamp = scheduledAt.toISOString().replace('.000Z', 'Z').replaceAll(':', '-');
	const keys = [`hourly/${stamp}.sql`];
	if (scheduledAt.getUTCHours() === 0) keys.push(`daily/${stamp}.sql`);

	for (const key of keys) {
		await step.do(`Store ${key}`, async () => {
			const response = await fetcher(signedUrl);
			if (!response.ok || !response.body)
				throw new Error(`D1 dump download HTTP ${response.status}`);
			await env.BACKUP_BUCKET.put(key, response.body, {
				customMetadata: {
					bookmark: started.at_bookmark!,
					scheduled_at: scheduledAt.toISOString()
				}
			});
		});
	}
	return keys;
}
