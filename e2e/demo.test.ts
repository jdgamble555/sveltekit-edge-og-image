import { expect, test } from '@playwright/test';

test('home page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
});

test('OG endpoint renders a PNG with the requested dimensions', async ({ request }) => {
	const response = await request.get('/og?width=600&height=400');
	expect(response.status()).toBe(200);
	expect(response.headers()['content-type']).toContain('image/png');
	const image = await response.body();
	expect(image.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
	expect(image.readUInt32BE(16)).toBe(600);
	expect(image.readUInt32BE(20)).toBe(400);
});
