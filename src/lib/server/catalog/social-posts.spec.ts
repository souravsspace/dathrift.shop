import { expect, it } from 'vitest';
import { localDatabase } from '../testing/local-d1';
import { removeProduct } from './admin';
import { listSocialPosts, resetSocialPost, saveSocialPost } from './social-posts';

it('saves one edited caption per piece and format, replacing earlier edits', async () => {
	const { db } = localDatabase();
	expect(await listSocialPosts(db, 'test-shirt')).toEqual([]);
	const first = await saveSocialPost(db, 'test-shirt', {
		format: 'ig-square',
		caption: 'Olive shirt, ৳1,200',
		basis: 'generated text'
	});
	expect(first).toMatchObject({ format: 'ig-square', caption: 'Olive shirt, ৳1,200' });
	await saveSocialPost(db, 'test-shirt', {
		format: 'ig-square',
		caption: 'Edited again',
		basis: 'newer generated text'
	});
	await saveSocialPost(db, 'test-shirt', { format: 'fb-story', caption: 'Story', basis: '' });
	const saved = await listSocialPosts(db, 'test-shirt');
	expect(saved.map(({ format, caption, basis }) => ({ format, caption, basis }))).toEqual(
		expect.arrayContaining([
			{ format: 'ig-square', caption: 'Edited again', basis: 'newer generated text' },
			{ format: 'fb-story', caption: 'Story', basis: '' }
		])
	);
	expect(saved).toHaveLength(2);
});

it('rejects unknown formats, blank or oversized captions and missing pieces', async () => {
	const { db } = localDatabase();
	const valid = { format: 'ig-square', caption: 'Caption', basis: '' };
	await expect(saveSocialPost(db, 'test-shirt', { ...valid, format: 'tiktok' })).rejects.toThrow(
		'Invalid caption'
	);
	await expect(saveSocialPost(db, 'test-shirt', { ...valid, caption: '   ' })).rejects.toThrow(
		'Invalid caption'
	);
	await expect(
		saveSocialPost(db, 'test-shirt', { ...valid, caption: 'x'.repeat(5001) })
	).rejects.toThrow('Invalid caption');
	await expect(saveSocialPost(db, 'no-such-piece', valid)).rejects.toThrow('Product not found');
});

it('resets a format back to the generated caption', async () => {
	const { db } = localDatabase();
	await saveSocialPost(db, 'test-shirt', { format: 'ig-story', caption: 'Edited', basis: '' });
	expect(await resetSocialPost(db, 'test-shirt', { format: 'ig-story' })).toEqual({
		format: 'ig-story',
		variant: 'classic'
	});
	expect(await listSocialPosts(db, 'test-shirt')).toEqual([]);
	await expect(resetSocialPost(db, 'test-shirt', { format: 'nope' })).rejects.toThrow(
		'Invalid caption'
	);
});

it('deletes saved captions with a never-sold piece', async () => {
	const { db, sqlite } = localDatabase();
	await saveSocialPost(db, 'test-draft', { format: 'ig-square', caption: 'Draft', basis: '' });
	const bucket = { delete: async () => undefined };
	expect(await removeProduct(db, bucket, 'test-draft')).toEqual({ outcome: 'deleted' });
	expect(
		sqlite
			.prepare("SELECT COUNT(*) AS n FROM product_social_posts WHERE product_id = 'test-draft'")
			.get()
	).toEqual({ n: 0 });
});

it('keeps one edit per caption variant and resets only the chosen one', async () => {
	const { db } = localDatabase();
	await saveSocialPost(db, 'test-shirt', {
		format: 'original',
		caption: 'Classic edit',
		basis: ''
	});
	await saveSocialPost(db, 'test-shirt', {
		format: 'original',
		variant: 'drop',
		caption: 'Drop edit',
		basis: ''
	});
	expect(
		(await listSocialPosts(db, 'test-shirt')).map(({ format, variant, caption }) => ({
			format,
			variant,
			caption
		}))
	).toEqual(
		expect.arrayContaining([
			{ format: 'original', variant: 'classic', caption: 'Classic edit' },
			{ format: 'original', variant: 'drop', caption: 'Drop edit' }
		])
	);
	await resetSocialPost(db, 'test-shirt', { format: 'original', variant: 'drop' });
	expect((await listSocialPosts(db, 'test-shirt')).map((row) => row.variant)).toEqual(['classic']);
	await expect(
		saveSocialPost(db, 'test-shirt', {
			format: 'ig-square',
			variant: 'shouty',
			caption: 'x',
			basis: ''
		})
	).rejects.toThrow('Invalid caption');
});
