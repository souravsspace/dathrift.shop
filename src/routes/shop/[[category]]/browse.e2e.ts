import { expect, test } from '@playwright/test';

test('switching category swaps the pieces in place instead of reloading the page', async ({
	page
}) => {
	await page.goto('/shop', { waitUntil: 'networkidle' });
	// A mark on the live page survives only if the page component is kept, not rebuilt.
	await page.evaluate(() => document.querySelector('.browse')?.setAttribute('data-mark', 'kept'));
	await page.getByRole('link', { name: /^Tops/ }).click();
	await expect(page).toHaveURL(/\/shop\/tops$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tops');
	await expect(page.locator('.browse[data-mark="kept"]')).toHaveCount(1);
	await expect(page.getByRole('link', { name: /^Tops/ })).toHaveAttribute('aria-current', 'page');
});

test('the shop search narrows the pieces as the shopper types', async ({ page }) => {
	await page.goto('/shop', { waitUntil: 'networkidle' });
	await page.getByRole('searchbox', { name: 'Search pieces' }).fill('olive');
	await expect(page).toHaveURL(/\/shop\?q=olive$/);
	await expect(page.locator('.grid > li')).toHaveCount(1);
	await expect(page.getByText('TEST ONLY — Olive cotton shirt')).toBeVisible();
	await expect(page.getByRole('searchbox', { name: 'Search pieces' })).toHaveValue('olive');
});
