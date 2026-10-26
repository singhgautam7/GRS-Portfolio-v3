import { expect, test } from './fixtures';

/**
 * Visual regression in light and dark: hero poster state per keyboard (WebGL disabled so the
 * poster is deterministic), the selector, the palette and the playground. These screenshots are
 * also what gets compared against the design frames.
 */
for (const mode of ['light', 'dark'] as const) {
  test.describe(mode, () => {
    test.use({ colorScheme: mode });
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
    });
    for (const v of ['thk', 'tik', 'clk', 'pop', 'pew', '8bt']) {
      test(`hero poster ${v}`, async ({ page }) => {
        await page.addInitScript((id) => localStorage.setItem('grs:kb', JSON.stringify({ v: 1, data: { variant: id, muted: true } })), v);
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-hero]')).toHaveScreenshot(`hero-${v}-${mode}.png`);
      });
    }
    test('selector open', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /^Keyboard: / }).click();
      await expect(page.locator('[data-hero]')).toHaveScreenshot(`selector-${mode}.png`);
    });
    test('palette', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Search' }).first().click();
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot(`palette-${mode}.png`);
    });
    test('playground picker', async ({ page }) => {
      await page.goto('/playground/');
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(`playground-${mode}.png`); // reduced motion: no particles, deterministic
    });
  });
}
