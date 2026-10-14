import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { version: string };

test('theme follows the system, persists a choice, and shows the author/version', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Dark mode', exact: true });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(23, 21, 28)');
  const author = page.getByRole('contentinfo').getByRole('link', { name: 'uzuw on GitHub' });
  await expect(author).toHaveAttribute('href', 'https://github.com/uzuw');
  await expect(page.getByRole('contentinfo')).toContainText(`v${version}`);
  await page.getByRole('contentinfo').screenshot({ path: 'test-results/preview-footer.png' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.calendar-grid')).toBeVisible();
  await page.screenshot({ path: 'test-results/preview-calendar-light.png', fullPage: true });
  await page.getByRole('link', { name: 'Rashifal राशिफल' }).click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.reading-panel')).toBeVisible();
  await page.screenshot({ path: 'test-results/preview-rashifal-dark.png', fullPage: true });
  await page.getByRole('link', { name: 'Gold & silver सुनचाँदी' }).click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.chart-panel')).toHaveCSS('background-color', 'rgb(33, 30, 39)');
  await page.screenshot({ path: 'test-results/preview-metals-dark.png', fullPage: true });
  await page.getByRole('link', { name: 'Calendar पात्रो' }).click();
  await expect(page.locator('.calendar-grid')).toBeVisible();
  await page.screenshot({ path: 'test-results/preview-calendar-dark.png', fullPage: true });
  await page.setViewportSize({ width: 360, height: 800 });
  for (const route of ['/', '/rashifal', '/metals']) {
    await page.goto(route);
    await expect(toggle).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      360,
    );
  }
  await page.goto('/');
  await page.screenshot({ path: 'test-results/preview-mobile-dark.png', fullPage: true });
  await toggle.click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(250, 250, 250)');
  expect(errors).toEqual([]);
});

test('theme works when browser storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage denied', 'SecurityError');
      },
    });
  });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Dark mode', exact: true });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});
