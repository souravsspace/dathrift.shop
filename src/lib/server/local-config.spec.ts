import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('binds only disposable local D1 and R2 fixtures by default', () => {
	const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));

	expect(config.workers_dev).toBe(false);
	expect(config.preview_urls).toBe(false);
	expect(config.d1_databases).toEqual([
		{
			binding: 'DB',
			database_name: 'dathrift-local',
			database_id: '00000000-0000-0000-0000-000000000000',
			migrations_dir: 'db/migrations'
		}
	]);
	expect(config.r2_buckets).toEqual([
		{ binding: 'PRODUCT_IMAGES', bucket_name: 'dathrift-local-products' }
	]);
});
