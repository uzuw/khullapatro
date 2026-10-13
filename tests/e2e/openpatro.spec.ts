import { expect, test } from '@playwright/test';
import type { Envelope, CalendarData, RashifalData, MetalsData } from '../../src/lib/contracts';
import { money, formatDate } from '../../src/lib/date';
import { periodHistory, summarize } from '../../src/lib/market';

test('calendar API validates input and retains all source records', async ({ request }) => {
  for (const query of [
    'year=2083',
    'year=2083&month=0',
    'year=2101&month=1',
    'year=2083.1&month=6',
  ]) {
    const response = await request.get(`/api/calendar?${query}`);
    expect(response.status()).toBe(400);
    expect((await response.json()).error.code).toBe('INVALID_REQUEST');
  }
  const response = await request.get('/api/calendar');
  const body: Envelope<CalendarData> = await response.json();
  expect(response.status()).toBe(200);
  expect(body.data.days.filter((d) => d.inMonth)).toHaveLength(31);
  expect(body.data.days.find((d) => d.ad === '2026-09-17')?.events).toHaveLength(6);
  expect(body.meta.nepalDate).toBe('2026-10-13');
});

test('calendar exposes every event and supports keyboard date selection', async ({
  page,
  request,
}) => {
  const body: Envelope<CalendarData> = await (await request.get('/api/calendar')).json();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your days, clearly.' })).toBeVisible();
  await expect(page.locator('.calendar-grid > button')).toHaveCount(body.data.days.length);
  const day = body.data.days.find((d) => d.events.length === 6)!;
  const cell = page.locator('.calendar-grid > button').filter({ hasText: day.events[0].titleNp });
  await cell.press('Enter');
  await expect(cell).toHaveAttribute('aria-pressed', 'true');
  const detail = page.getByRole('complementary', { name: 'Selected date details' });
  await expect(detail.locator('li')).toHaveCount(6);
  for (const event of day.events)
    await expect(detail.getByText(event.titleNp, { exact: true })).toBeVisible();
  const empty = body.data.days.find((d) => d.inMonth && !d.events.length)!;
  await page
    .getByRole('button', {
      name: `${empty.bs.day} असोज 2083, ${formatDate(empty.ad)}, no events listed`,
      exact: true,
    })
    .click();
  await expect(detail).toContainText('No events listed for this date.');
  await page.getByRole('button', { name: 'Today आज' }).click();
  await expect(detail).toContainText('Today in Nepal');
});

test('month/year controls cross BS years and respect sampled range boundaries', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('BS month').selectOption('12');
  await expect(page.getByLabel('BS month')).toHaveValue('12');
  await page.getByRole('button', { name: 'Next month' }).click();
  await expect(page.getByLabel('BS year')).toHaveValue('2084');
  await expect(page.getByLabel('BS month')).toHaveValue('1');
  await page.getByRole('button', { name: 'Previous month' }).click();
  await expect(page.getByLabel('BS year')).toHaveValue('2083');
  await expect(page.getByLabel('BS month')).toHaveValue('12');
  await page.getByLabel('BS year').selectOption('2100');
  await expect(page.getByLabel('BS year')).toHaveValue('2100');
  await expect(page.getByRole('button', { name: 'Next month' })).toBeDisabled();
  await page.getByLabel('BS month').selectOption('1');
  await expect(page.getByLabel('BS month')).toHaveValue('1');
  await page.getByLabel('BS year').selectOption('2000');
  await expect(page.getByLabel('BS year')).toHaveValue('2000');
  await expect(page.getByRole('button', { name: 'Previous month' })).toBeDisabled();
  await page.getByRole('button', { name: 'Today आज' }).click();
  await expect(page.getByLabel('BS year')).toHaveValue('2083');
  await expect(page.getByLabel('BS month')).toHaveValue('6');
});

test('failed month navigation preserves the displayed month and recovers', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('BS month')).toHaveValue('6');
  await page.getByRole('button', { name: 'Next month' }).click();
  await expect(page.locator('.data-notice')).toContainText('different calendar month');
  await expect(page.getByLabel('BS month')).toHaveValue('6');
  await expect(page.locator('.calendar-grid > button')).toHaveCount(35);
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('.data-notice')).toHaveCount(0);
});

test('three navigation links work and twelve complete readings are selectable', async ({
  page,
  request,
}) => {
  const body: Envelope<RashifalData> = await (await request.get('/api/rashifal')).json();
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: 'Rashifal राशिफल' }).click();
  await expect(page).toHaveURL(/\/rashifal$/);
  await expect(page.locator('.sign-grid button')).toHaveCount(12);
  for (const sign of body.data.signs) {
    await page.getByRole('button', { name: `Choose ${sign.nameEn}` }).click();
    await expect(
      page.getByRole('region', { name: 'Daily reading' }).getByRole('heading'),
    ).toHaveText(sign.nameNp);
    await expect(page.locator('.reading-text')).toHaveText(sign.textNp);
  }
  await expect(page.locator('.reading-text-en')).toHaveCount(0);
  await expect(page.locator('.reading-date')).toContainText(formatDate(body.data.readingDateAd!));
  await page.getByRole('navigation').getByRole('link', { name: 'Gold & silver सुनचाँदी' }).click();
  await expect(page).toHaveURL(/\/metals$/);
  await expect(page.getByRole('heading', { name: 'Keep an eye on value.' })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Calendar पात्रो' }).click();
  await expect(page).toHaveURL('/');
});

test('metal and period controls update chart, summaries and exact price table', async ({
  page,
  request,
}) => {
  const body: Envelope<MetalsData> = await (await request.get('/api/metals')).json();
  await page.goto('/metals');
  await expect(page.locator('.quote-gold .quote-value')).toContainText(
    money(body.data.quote!.gold!),
  );
  await expect(page.locator('.quote-silver .quote-value')).toContainText(
    money(body.data.quote!.silver!),
  );
  await expect(page.locator('.market-date')).toContainText('NPR per tola');
  expect(
    await page.locator('.chart-unit svg').evaluate((el) => el.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(12);
  for (const metal of ['gold', 'silver'] as const) {
    await page
      .getByRole('tab', { name: metal === 'gold' ? 'Gold' : 'Silver', exact: true })
      .click();
    for (const [label, days] of [
      ['7D', 7],
      ['30D', 30],
      ['1Y', 365],
    ] as const) {
      await page.getByRole('tab', { name: label, exact: true }).click();
      const rows = periodHistory(body.data.history, days);
      const summary = summarize(rows, metal)!;
      await expect(page.getByRole('img')).toHaveAttribute(
        'aria-label',
        `${metal} historical price chart; all exact observations are in the table below.`,
      );
      await expect(page.locator('.market-stats')).toContainText(money(summary.low));
      await expect(page.locator('.market-stats')).toContainText(money(summary.high));
      await expect(page.locator('.chart-points circle')).toHaveCount(summary.rows.length);
      expect(rows.length).toBe(days === 7 ? 4 : days === 30 ? 7 : 10);
      await expect(page.locator('tbody tr')).toHaveCount(Math.min(7, rows.length));
      const last = rows.at(-1)!;
      await expect(page.locator('tbody tr').first()).toContainText(formatDate(last.date));
      await expect(page.locator('tbody tr').first()).toContainText(
        last[metal] === null ? 'Unavailable' : money(last[metal]!),
      );
      if (rows.length > 7) {
        await page.getByRole('button', { name: `Show all ${rows.length} observations` }).click();
        await expect(page.locator('tbody tr')).toHaveCount(rows.length);
        await page.getByRole('button', { name: 'Show fewer observations' }).click();
      }
    }
  }
});

test('configured NextAuth presents sign-in and creates a safe OAuth redirect without contacting GitHub', async ({
  page,
  request,
}) => {
  const origin = 'http://localhost:3004';
  await page.goto(origin + '/sign-in');
  await expect(page.getByRole('button', { name: 'Continue with GitHub' })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link')).toHaveCount(3);
  const providers = await (await request.get(origin + '/api/auth/providers')).json();
  expect(providers.github.id).toBe('github');
  const csrf = await (await request.get(origin + '/api/auth/csrf')).json();
  const result = await request.post(origin + '/api/auth/signin/github', {
    form: { csrfToken: csrf.csrfToken, callbackUrl: 'https://example.com/untrusted' },
    maxRedirects: 0,
  });
  expect(result.status()).toBe(302);
  const redirect = new URL(result.headers().location);
  expect(redirect.origin).toBe('https://github.com');
  expect(redirect.searchParams.get('client_id')).toBe('openpatro-test-client');
  expect(redirect.searchParams.get('redirect_uri')).toBe(origin + '/api/auth/callback/github');
  expect(redirect.searchParams.get('code_challenge')).toBeTruthy();
  expect(redirect.searchParams.get('code_challenge_method')).toBe('S256');
  const callbackCookie = result.headers()['set-cookie'];
  expect(callbackCookie).not.toContain('example.com');
  expect(callbackCookie).toContain('HttpOnly');
});

test('security headers, self-hosted fonts and original artwork are served', async ({
  page,
  request,
}) => {
  const response = await request.get('/');
  const headers = response.headers();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['x-powered-by']).toBeUndefined();
  await page.goto('/');
  await expect(page.locator('.heading-art img')).toHaveAttribute('src', '/art/mountains.svg');
  expect(
    await page
      .locator('.heading-art img')
      .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
  ).toBe(true);
  expect(await page.locator('link[rel="preload"][as="font"]').count()).toBeGreaterThan(0);
  const session = await request.get('/api/auth/session');
  expect(session.status()).toBe(200);
  expect(await session.json()).toBeNull();
  const csrf = await request.get('/api/auth/csrf');
  expect((await csrf.json()).csrfToken).toBeTruthy();
  await page.goto('/sign-in');
  await expect(page.locator('.auth-unconfigured')).toContainText('without an account');
});

for (const [path, heading] of [
  ['/', 'Your days, clearly.'],
  ['/rashifal', 'A moment for you.'],
  ['/metals', 'Keep an eye on value.'],
]) {
  test(`360px layout stays within the viewport: ${path}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.getByRole('navigation')).toBeVisible();
    if (path === '/') {
      await page.getByRole('button', { name: /^1 असोज 2083,/ }).click();
      await expect(page.getByRole('complementary').locator('li')).toHaveCount(6);
    }
    await page.screenshot({ path: testInfo.outputPath('mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 1365, height: 1000 });
    await page.screenshot({ path: testInfo.outputPath('desktop.png'), fullPage: true });
  });
}
