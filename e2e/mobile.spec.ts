import { expect, test } from './fixtures';

test.use({ webgl: true }); // phones must never load the 3D keyboard, even with WebGL available

test('mobile hero: keycap cluster, no keyboard hints, Ask opens a sheet, no three.js', async ({ page }) => {
  const scripts: string[] = [];
  page.on('response', (r) => r.url().endsWith('.js') && scripts.push(r.url()));
  await page.goto('/');
  await expect(page.getByRole('link', { name: /run Open the playground/ })).toBeVisible();
  await expect(page.getByText('Go on, press a key.')).toBeHidden();
  await page.getByRole('button', { name: 'Ask about me' }).click();
  await expect(page.getByRole('dialog', { name: 'Ask about me' })).toBeVisible();
  await page.waitForTimeout(1500);
  expect(await page.locator('[data-hero] canvas').count()).toBe(0);
});

test('mobile playground: scenarios, slider and break something', async ({ page }) => {
  await page.goto('/playground/');
  await expect(page.getByText('Best on desktop')).toBeVisible();
  await page.getByRole('button', { name: /Your app goes viral/ }).click();
  await expect(page.getByRole('slider', { name: /Traffic/ })).toBeVisible();
  await page.getByRole('button', { name: /Break something/ }).click();
  await expect(page.getByRole('menuitem', { name: /Kill a server/ })).toBeVisible();
});
