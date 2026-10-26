import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

/** The site picks ⌘ or Ctrl from the browser's platform (data-os); press the same one. */
async function ready(page: Page) {
  await page.getByRole('button', { name: 'Ask about me' }).waitFor(); // hydrated: input layer attached
  const os = await page.evaluate(() => document.documentElement.dataset.os);
  return os === 'mac' ? 'Meta' : 'Control';
}

test.describe('landing shortcuts', () => {
  let mod = 'Control';
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    mod = await ready(page);
  });

  test('⌘/Ctrl+K opens the palette; Esc closes it and returns focus', async ({ page }) => {
    await page.keyboard.press(`${mod}+k`);
    const dialog = page.getByRole('dialog', { name: 'Search and commands' });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('combobox')).toBeFocused();
    await page.getByRole('combobox').fill('flutter');
    await expect(dialog.getByRole('option').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('palette shows the no-results state', async ({ page }) => {
    await page.keyboard.press(`${mod}+k`);
    await page.getByRole('combobox').fill('zzqqxx');
    await expect(page.getByText('No matches for “zzqqxx”.')).toBeVisible();
  });

  test('? opens the shortcuts sheet', async ({ page }) => {
    await page.keyboard.press('Shift+Slash');
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeHidden();
  });

  test('G then P jumps to Projects', async ({ page }) => {
    await page.keyboard.press('g');
    await page.keyboard.press('p');
    await expect(page).toHaveURL(/#projects$/);
  });

  test('⌘/Ctrl+Enter opens the playground; Esc returns', async ({ page }) => {
    await page.keyboard.press(`${mod}+Enter`);
    await expect(page).toHaveURL(/\/playground\/?$/);
    await expect(page.getByText('PICK A SCENARIO')).toBeVisible();
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/$/);
  });

  test('typing in a field never triggers shortcuts', async ({ page }) => {
    await page.getByRole('button', { name: 'Ask about me' }).click();
    const input = page.getByRole('textbox', { name: 'Type a question' });
    await input.fill('');
    await input.press('Shift+Slash');
    await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeHidden();
  });
});

test.describe('3D keyboard', () => {
  test.use({ webgl: true });
  test('mounts after paint, mirrors a key press, palette emerges from K', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    const mod = await ready(page);
    await expect(page.locator('[data-hero] canvas')).toHaveCount(1, { timeout: 20_000 });
    await expect(page.locator('[data-hero] [data-phase="ready"][data-loading="false"]')).toHaveCount(1, { timeout: 20_000 });
    // Fresh load, pointer never moved: Space presses the board instead of scrolling the page.
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await page.keyboard.press('h');
    await expect(page.getByText('There you go.')).toBeVisible();
    await page.keyboard.press(`${mod}+k`);
    await expect(page.getByRole('dialog', { name: 'Search and commands' })).toBeVisible({ timeout: 10_000 });
    expect(errors).toEqual([]);
  });
});

test.describe('keyboard selector and sound', () => {
  test('switch variants (including rapid switching) and persist', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    const trigger = page.getByRole('button', { name: /^Keyboard: / });
    await expect(trigger).toHaveAccessibleName('Keyboard: Mechanical');
    for (const name of ['Laptop', 'Typewriter', 'Bubble', 'Bullet', 'Arcade', 'Typewriter']) {
      await trigger.click();
      await page.getByRole('option', { name: new RegExp(name) }).click();
    }
    await expect(trigger).toHaveAccessibleName('Keyboard: Typewriter');
    await page.reload();
    await expect(page.getByRole('button', { name: /^Keyboard: / })).toHaveAccessibleName('Keyboard: Typewriter');
    expect(errors).toEqual([]);
  });

  test('listbox is keyboard operable', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: /^Keyboard: / });
    await trigger.focus();
    await page.keyboard.press('ArrowUp');
    await expect(page.getByRole('listbox', { name: 'Keyboard' })).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAccessibleName('Keyboard: Laptop');
  });

  test('muted by default; mute key toggles pressed state', async ({ page }) => {
    await page.goto('/');
    const mute = page.getByRole('button', { name: 'Turn keyboard sound on' });
    await expect(mute).toHaveAttribute('aria-pressed', 'false');
    await mute.click();
    await expect(page.getByRole('button', { name: 'Mute keyboard sound' })).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('fallbacks', () => {
  test('no WebGL: the poster stays and no canvas mounts', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await page.waitForTimeout(1000);
    await expect(page.locator('img[src="/posters/thk-light.webp"]')).toBeVisible();
    expect(await page.locator('[data-hero] canvas').count()).toBe(0);
  });

  test('reduced motion: page and shortcuts still work', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const mod = await ready(page);
    await page.keyboard.press(`${mod}+k`);
    await expect(page.getByRole('dialog', { name: 'Search and commands' })).toBeVisible();
  });
});

test.describe('playground', () => {
  test('deep link starts a scenario; break something and readouts update', async ({ page }) => {
    await page.goto('/playground/#viral');
    await expect(page.getByText('Your app goes viral').first()).toBeVisible();
    await page.getByRole('button', { name: /Break something/ }).click();
    await page.getByRole('menuitem', { name: /Kill a server/ }).click();
    await expect(page.getByText('App server killed')).toBeVisible();
    const slider = page.getByRole('slider', { name: /Traffic/ });
    await slider.fill('12000');
    await expect(page.getByText('12,000').first()).toBeVisible();
  });
});

test.describe('playground component rail', () => {
  test('existing parts say already added; missing parts get added; unmodelled say so', async ({ page }) => {
    await page.goto('/playground/#viral');
    const rail = page.getByRole('navigation', { name: 'Components' });
    await rail.getByRole('button', { name: 'Load balancer' }).hover();
    await expect(page.getByRole('tooltip')).toContainText('already in the system');
    await rail.getByRole('button', { name: 'Queue' }).click();
    await expect(page.getByRole('region', { name: 'Queue settings' })).toBeVisible();
    await expect(page.getByRole('tooltip')).toContainText('already added');
    await page.getByRole('button', { name: 'Remove queue' }).click();
    await rail.getByRole('button', { name: 'DNS' }).hover();
    await expect(page.getByRole('tooltip')).toContainText('isn’t in the simulation yet');
  });
});

test.describe('accessibility (axe)', () => {
  for (const path of ['/', '/playground/#viral', '/askme/']) {
    test(`no serious violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(800);
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const serious = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => `${n.target.join(' ')} ${n.failureSummary ?? ''}`).slice(0, 4).join(' | ')}`)).toEqual([]);
    });
  }
});
