import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { expect, test } from '@playwright/test';

test('shows public sign-in and sign-up links and opens both forms', async ({ page }) => {
  await page.goto('/');
  const header = page.getByRole('banner');
  await expect(header.getByRole('link', { name: 'Sign In', exact: true })).toBeVisible();
  await header.getByRole('link', { name: 'Sign Up', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
  await expect(page.getByLabel('Confirm password', { exact: true })).toBeVisible();
  await header.getByRole('link', { name: 'Sign In', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
});

test('registers from a guest draft, saves to MariaDB, updates profile and signs in again', async ({ page }) => {
  test.skip(process.env.FEELCRAFT_TEST_MYSQL !== '1', 'Requires the running database-backed development stack');
  const { createDatabase, checkDatabase } = await import('../../backend/src/config/database.js');
  const env = parseEnv(await readFile(new URL('../../backend/.env', import.meta.url), 'utf8'));
  const db = createDatabase({ ...env, ...process.env, DB_DISABLED: 'false' });
  const email = randomUUID() + '@feelcraft.test';
  const password = randomUUID();
  const title = 'Guest letter for my account';
  try {
    await checkDatabase(db);
    await page.goto('/editor/new?storage=local');
    await page.getByLabel('Design name').fill(title);
    await page.getByRole('button', { name: 'Add Text' }).click();
    await page.getByRole('textbox', { name: 'Text', exact: true }).fill('A draft started as a guest');
    await page.getByRole('button', { name: 'Save to Account' }).click();
    await expect(page).toHaveURL(/\/login\?draft=/);
    await page.locator('main').getByRole('link', { name: 'Sign Up' }).click();
    const form = page.locator('main form');
    await form.getByLabel('Name').fill('Auth test');
    await form.getByLabel('Email').fill(email);
    await form.getByLabel('Password', { exact: true }).fill(password);
    await form.getByLabel('Confirm password', { exact: true }).fill('mismatch');
    await form.getByRole('button', { name: 'Show password', exact: true }).click();
    await expect(form.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
    await form.getByRole('button', { name: 'Hide password', exact: true }).click();
    await form.getByRole('button', { name: 'Sign Up' }).click();
    await expect(form.getByText('Passwords must match.')).toBeVisible();
    await form.getByLabel('Confirm password', { exact: true }).fill(password);
    await form.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL(/\/dashboard\?draft=/);
    await page.getByRole('button', { name: 'Save Draft to Account' }).click();
    await expect(page.getByRole('status', { name: 'Save status' })).toHaveText(/Account draft .* Saved/);
    await page.reload();
    await expect(page.getByLabel('Design name')).toHaveValue(title);
    await expect(page.getByRole('button', { name: 'A draft started as a guest', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'My Drafts' }).click();
    await page.getByLabel('Profile menu').click();
    await page.getByRole('link', { name: 'Account Settings' }).click();
    await page.getByLabel('Display name').fill('Updated profile');
    await page.getByRole('button', { name: 'Save Profile' }).click();
    await expect(page.getByText('Profile saved.')).toBeVisible();
    await page.getByLabel('Profile menu').click();
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page.getByRole('heading', { name: /Some feelings deserve/ })).toBeVisible();
    await page.getByRole('banner').getByRole('link', { name: 'Sign In', exact: true }).click();
    await form.getByLabel('Email').fill(email);
    await form.getByLabel('Password', { exact: true }).fill('incorrect-password');
    await form.getByRole('button', { name: 'Sign In' }).click();
    await expect(form.getByRole('alert')).toHaveText('Email or password is incorrect.');
    await form.getByLabel('Password', { exact: true }).fill(password);
    await form.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.getByLabel('Profile menu')).toHaveText('Updated profile');
    await page.getByRole('link', { name: 'Local drafts', exact: true }).click();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  } finally {
    try {
      await db.execute('DELETE FROM users WHERE email = ?', [email]);
    } finally {
      await db.end();
    }
  }
});
