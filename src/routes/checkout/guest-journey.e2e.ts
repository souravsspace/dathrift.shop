import { expect, test } from '@playwright/test';

test('guest pays by bKash Send Money; pieces stay sold out until staff confirm the payment', async ({
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
	await page.getByRole('textbox', { name: 'Phone' }).fill('+880 1712-345678');
	await page.getByRole('textbox', { name: 'Address line' }).fill('Test building');
	await page
		.getByRole('combobox', { name: 'Delivery area' })
		.selectOption('test-dhaka/test-central');
	await page.getByRole('button', { name: 'Check total' }).click();
	await page.getByRole('button', { name: 'Continue to bKash payment' }).click();

	// Step 3 lives on the order page, so a refresh keeps the buyer where they were.
	await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}$/);
	const orderUrl = page.url();
	await page.reload({ waitUntil: 'networkidle' });
	await expect(page.getByText('Send your bKash payment')).toBeVisible();
	await expect(page.getByText('01849-584594')).toBeVisible();

	// Held pieces read as sold out to everyone else.
	await page.goto('/products/test-olive-cotton-shirt');
	await expect(page.getByText('Sold out')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Add to bag' })).toHaveCount(0);

	await page.goto(orderUrl, { waitUntil: 'networkidle' });
	await page.getByText('Delivery charge only').click();
	await page.getByRole('textbox', { name: 'bKash transaction ID' }).fill('8n7a6d5c4b');
	await page.getByRole('button', { name: 'I have sent ৳80' }).click();
	await expect(page.getByText('Payment sent, we are checking it')).toBeVisible();
	await expect(page.getByText('8N7A6D5C4B')).toBeVisible();

	await page.goto('/admin/orders', { waitUntil: 'networkidle' });
	await expect(page.getByText('Check payment').first()).toBeVisible();
	await page.locator('a.order-row', { hasText: 'Test Buyer' }).first().click();
	await page.waitForLoadState('networkidle');
	await page.getByRole('checkbox', { name: /I found this payment in the bKash app/ }).check();
	await page.getByRole('button', { name: 'Payment found · mark paid' }).click();
	await expect(page.getByText('Paid · to ship')).toBeVisible();
	await expect(page.getByText(/courier must collect/)).toContainText('৳2,300');

	await page.goto(orderUrl);
	await expect(page.getByText('Payment confirmed', { exact: true })).toBeVisible();
	await page.goto('/products/test-olive-cotton-shirt');
	await expect(page.getByText('Sold out')).toBeVisible();
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
