import { expect, it } from 'vitest';
import { unzipSync } from 'fflate';
import { zipFiles } from './download';

it('packs rendered images into one ZIP without recompressing them', async () => {
	const files = [
		new File([new Uint8Array([1, 2, 3])], 'oc2026005-ig-square-1.png', { type: 'image/png' }),
		new File([new Uint8Array([4, 5])], 'oc2026005-ig-square-2.jpg', { type: 'image/jpeg' })
	];
	const zip = await zipFiles(files);
	expect(zip.type).toBe('application/zip');
	const entries = unzipSync(new Uint8Array(await zip.arrayBuffer()));
	expect(Object.keys(entries)).toEqual(['oc2026005-ig-square-1.png', 'oc2026005-ig-square-2.jpg']);
	expect([...entries['oc2026005-ig-square-2.jpg']]).toEqual([4, 5]);
});
