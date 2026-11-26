import { expect, test } from '@playwright/test';

test('animates the envelope and moves focus to the revealed letter', async ({ page }) => {
  await page.goto('/demo/eternal-love');
  await page.getByRole('button', { name: 'Open Your Message' }).click();
  await expect(page.getByRole('button', { name: 'Opening…' })).toBeDisabled();
  await expect(page.getByRole('heading', { name: 'The little things' })).toBeVisible();
  await expect(page.getByLabel('Opened message')).toBeFocused();
});

test('opens a letter from a feeling, reveals it, and replays it', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Some feelings deserve more than just words.' })).toBeVisible();
  await page.getByRole('link', { name: /Sadness A little space/ }).click();
  await expect(page.getByRole('heading', { name: 'Sadness Templates' })).toBeVisible();
  await page.getByRole('link', { name: 'Preview Silent Tears' }).click();
  await page.getByRole('link', { name: 'Open Sample Letter' }).click();
  await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Open Your Message' }).click();
  await expect(page.getByRole('heading', { name: 'I miss you today' })).toBeVisible();
  await page.getByRole('button', { name: 'Replay' }).click();
  await expect(page.getByRole('button', { name: 'Open Your Message' })).toBeFocused();
});

test('searches and filters the gallery and clears an empty state', async ({ page }) => {
  await page.goto('/templates');
  await expect(page.getByRole('status')).toHaveText('5 templates');
  await page.getByLabel('Collection').selectOption('premium');
  await expect(page.getByRole('status')).toHaveText('2 templates');
  await page.getByLabel('Style').selectOption('Botanical');
  await expect(page.getByRole('link', { name: 'Preview I’m Truly Sorry' })).toBeVisible();
  await page.getByLabel('Search').fill('nothing matches');
  await expect(page.getByRole('heading', { name: 'No matching templates' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByRole('status')).toHaveText('5 templates');
});

test('keeps the layout inside the viewport and supports reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  const toggle = page.getByRole('button', { name: 'Open navigation' });
  if (await toggle.isVisible()) {
    await toggle.click();
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
  }
  await page.getByRole('link', { name: 'Try the full-screen demo' }).click();
  await page.getByRole('button', { name: 'Skip animation' }).click();
  await expect(page.getByRole('heading', { name: 'The little things' })).toBeVisible();
});

test('all five previews render and an unknown route has a home link', async ({ page }) => {
  const slugs = ['eternal-love', 'unspoken-words', 'silent-tears', 'truly-sorry', 'secret-admirer'];

  for (const slug of slugs) {
    await page.goto(`/demo/${slug}`);
    await page.getByRole('button', { name: 'Skip animation' }).click();
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
  }

  await page.goto('/not-a-page');
  await expect(page.getByRole('heading', { name: 'This page is missing.' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to Home' }).click();
  await expect(page).toHaveURL('/');
});
