import { expect, test } from '@playwright/test';

test('guest buys two one-off pieces and both turn sold only after verified payment', async ({
	page
}, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'Purchases consume the single seeded units once.');
	await page.goto('/');
	await expect(page.getByText('Local preview · test pieces only')).toBeVisible();

	for (const slug of ['test-olive-cotton-shirt', 'test-cream-midi-dress']) {
		await page.goto(`/products/${slug}`, { waitUntil: 'networkidle' });
		await page.getByRole('button', { name: 'Add to bag' }).click();
		await expect(page.getByRole('link', { name: 'View bag' })).toBeVisible();
	}

	await page.goto('/cart', { waitUntil: 'networkidle' });
	await expect(page.getByText('৳2,300')).toBeVisible();
	await page.getByRole('link', { name: 'Continue to checkout' }).click();
	await page.waitForLoadState('networkidle');

	await page.getByRole('textbox', { name: 'Name' }).fill('Test Buyer');
	await page.getByRole('textbox', { name: 'Bangladesh phone' }).fill('01712345678');
	await page.getByRole('textbox', { name: 'Address line' }).fill('Test building');
	await page
		.getByRole('combobox', { name: 'Delivery area' })
		.selectOption('test-dhaka/test-central');
	await page.getByRole('button', { name: 'Check total' }).click();
	await page.getByRole('button', { name: 'Pay ৳2,380 with bKash' }).click();

	await expect(page.getByRole('heading', { name: 'Test wallet' })).toBeVisible();
	await page.getByRole('button', { name: 'Approve payment' }).click();

	await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
	await expect(page.getByText('Payment confirmed by bKash')).toBeVisible();
	await expect(page.getByText('৳2,380')).toBeVisible();

	await page.goto('/products/test-olive-cotton-shirt');
	await expect(page.getByText('Sold out')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Add to bag' })).toHaveCount(0);

	await page.goto('/admin/orders');
	await expect(page.getByText('Paid · to ship')).toBeVisible();
});

test('a sold piece left in a bag must be removed before checkout', async ({ page }) => {
	await page.goto('/');
	await page.evaluate(() => localStorage.setItem('dathrift-cart', '["test-sold"]'));
	await page.goto('/cart', { waitUntil: 'networkidle' });
	await expect(page.getByText('Unavailable piece')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Continue to checkout' })).toHaveCount(0);
	await page.getByRole('button', { name: 'Remove' }).click();
	await expect(page.getByText('Your bag is empty.')).toBeVisible();
});

test('a forged payment return never marks an order paid', async ({ page }) => {
	const response = await page.goto('/checkout/callback?paymentID=TESTforged&status=success');
	expect(response?.status()).toBe(404);
});
